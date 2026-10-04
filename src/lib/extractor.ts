import { DocumentSource, PageContent, Chunk, Topic, ProcessingQuality } from './types';

/**
 * Extracts selectable text from a PDF file using pdfjs-dist.
 * Gracefully handles worker configuration in browser environments.
 */
export async function extractFromPdfFile(file: File): Promise<{ pages: PageContent[]; quality: ProcessingQuality }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Dynamic import to avoid SSR issues
    const pdfjs = await import('pdfjs-dist');
    
    // Set worker source to CDN matching pdfjs-dist version
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.10.38'}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const pages: PageContent[] = [];
    const emptyPages: number[] = [];
    const flags: string[] = [];
    let totalChars = 0;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      
      const rawText = pageStrings.join(' ').replace(/\s+/g, ' ').trim();
      const wordCount = rawText ? rawText.split(/\s+/).length : 0;
      totalChars += rawText.length;

      let confidence = 95;
      let hasWarnings = false;
      let warningDetails: string | undefined = undefined;

      if (rawText.length < 50) {
        emptyPages.push(i);
        confidence = 20;
        hasWarnings = true;
        warningDetails = 'Page contains very little or no selectable text. May be an image, scan, or diagram.';
      } else if (rawText.length < 200) {
        confidence = 65;
        hasWarnings = true;
        warningDetails = 'Sparse text detected. Check if diagrams or handwritten formulas were missed.';
      }

      pages.push({
        pageNumber: i,
        text: rawText,
        confidence,
        wordCount,
        hasWarnings,
        warningDetails
      });
    }

    if (emptyPages.length > 0) {
      flags.push(`Pages ${emptyPages.join(', ')} contain very little selectable text (possible scans or diagrams).`);
    } else {
      flags.push('All pages contained clear selectable text.');
    }

    flags.push(`Extracted ${numPages} page(s) locally on your device.`);

    const quality: ProcessingQuality = {
      status: emptyPages.length > 0 ? 'warnings' : 'clean',
      flags,
      emptyPages,
      ocrUsed: false,
      rawCharacterCount: totalChars
    };

    return { pages, quality };
  } catch (err: any) {
    console.warn('PDF extraction fallback triggered:', err);
    // If pdfjs fails to parse (e.g. corrupted header), provide fallback
    return {
      pages: [
        {
          pageNumber: 1,
          text: `[PDF Parsing Notice: The file "${file.name}" could not be parsed via native PDF reader. Please check if the file is password-protected or scan-only.]`,
          confidence: 30,
          wordCount: 22,
          hasWarnings: true,
          warningDetails: err.message || 'PDF parse error'
        }
      ],
      quality: {
        status: 'low-confidence',
        flags: ['Unable to read PDF streams directly. Consider pasting text or saving as searchable PDF.'],
        emptyPages: [1],
        ocrUsed: false,
        rawCharacterCount: 100
      }
    };
  }
}

/**
 * Extracts text from plain text or markdown files.
 */
export async function extractFromTextFile(file: File): Promise<{ pages: PageContent[]; quality: ProcessingQuality }> {
  const content = await file.text();
  return processRawText(content, file.name);
}

/**
 * Processes raw text (e.g. pasted notes or imported text) into paginated content.
 */
export function processRawText(rawText: string, titleHint = 'Imported Notes'): { pages: PageContent[]; quality: ProcessingQuality } {
  // Normalize line endings
  const clean = rawText.replace(/\r\n/g, '\n').trim();
  
  // Split into pseudo-pages every ~500 words or by explicit page breaks (--- or Page X)
  const explicitPages = clean.split(/\n\s*---\s*\n|\n\s*\[Page\s+\d+\]\s*\n/i);
  
  const pages: PageContent[] = [];
  const flags: string[] = [];
  let totalChars = clean.length;

  if (explicitPages.length > 1) {
    explicitPages.forEach((pageText, idx) => {
      const trimmed = pageText.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      pages.push({
        pageNumber: idx + 1,
        text: trimmed,
        confidence: 99,
        wordCount: words,
        hasWarnings: words < 20,
        warningDetails: words < 20 ? 'Short section' : undefined
      });
    });
    flags.push(`Segmented into ${pages.length} sections based on notes delimiters.`);
  } else {
    // Break into logical pages of ~350 words if large
    const words = clean.split(/\s+/);
    const wordsPerPage = 350;
    const totalPages = Math.max(1, Math.ceil(words.length / wordsPerPage));
    
    for (let p = 0; p < totalPages; p++) {
      const pageWords = words.slice(p * wordsPerPage, (p + 1) * wordsPerPage);
      const pageText = pageWords.join(' ');
      pages.push({
        pageNumber: p + 1,
        text: pageText,
        confidence: 100,
        wordCount: pageWords.length,
        hasWarnings: false
      });
    }
    flags.push(`Formatted into ${pages.length} study page(s).`);
  }

  const quality: ProcessingQuality = {
    status: 'clean',
    flags,
    emptyPages: [],
    ocrUsed: false,
    rawCharacterCount: totalChars
  };

  return { pages, quality };
}

/**
 * Segments pages into search/retrieval chunks with keywords.
 */
export function segmentPagesIntoChunks(pages: PageContent[], docId: string): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkCounter = 1;

  for (const page of pages) {
    if (!page.text || page.text.length < 30) continue;

    // Split page text by paragraph or double newlines, or sentence clusters
    const paragraphs = page.text
      .split(/\n\s*\n|(?<=[.!?])\s{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 40);

    if (paragraphs.length === 0) {
      // Single chunk for page
      chunks.push({
        id: `chunk-${docId}-${chunkCounter++}`,
        pageNumber: page.pageNumber,
        text: page.text,
        keywords: extractKeywords(page.text)
      });
    } else {
      for (const para of paragraphs) {
        chunks.push({
          id: `chunk-${docId}-${chunkCounter++}`,
          pageNumber: page.pageNumber,
          text: para,
          keywords: extractKeywords(para)
        });
      }
    }
  }

  return chunks;
}

/**
 * Discovers topics from extracted pages and chunks.
 */
export function identifyTopicsFromContent(pages: PageContent[], chunks: Chunk[], docTitle: string): Topic[] {
  const topics: Topic[] = [];
  
  // Look for headings in text (e.g. "1. Topic Name", "Lecture 04:", "Module 3:", "## Topic")
  const headingRegex = /(?:^|\n)(?:#+\s*|\d+[\.\)]\s+|Lecture\s+\d+:?\s*|Unit\s+\d+:?\s*|Module\s+\d+:?\s*)([A-Z][^\n:]{4,60})/g;
  const discoveredTitles = new Set<string>();

  for (const page of pages) {
    let match;
    while ((match = headingRegex.exec(page.text)) !== null) {
      const title = match[1].trim();
      if (title.length > 5 && !discoveredTitles.has(title)) {
        discoveredTitles.add(title);
        
        // Find chunks related to this topic
        const relatedChunks = chunks.filter(c => 
          c.pageNumber === page.pageNumber || 
          c.text.toLowerCase().includes(title.toLowerCase().slice(0, 15))
        );

        const summary = relatedChunks.length > 0 
          ? relatedChunks[0].text.slice(0, 140) + '...'
          : `Core concept discussed in ${page.pageNumber === 1 ? 'initial section' : `Page ${page.pageNumber}`}.`;

        topics.push({
          id: `topic-${topics.length + 1}`,
          title: title,
          summary,
          pageReferences: [page.pageNumber],
          keyTerms: extractKeywords(title + ' ' + (relatedChunks[0]?.text || '')),
          chunkIds: relatedChunks.map(c => c.id)
        });
      }
    }
  }

  // If no formal headings were detected, synthesize meaningful topics from page sections
  if (topics.length === 0) {
    pages.forEach((page, idx) => {
      const preview = page.text.slice(0, 50).trim();
      const title = preview.length > 10 ? preview.split(/[.\n]/)[0] : `Section ${idx + 1}`;
      
      const relatedChunks = chunks.filter(c => c.pageNumber === page.pageNumber);
      topics.push({
        id: `topic-${idx + 1}`,
        title: title || `Key Concepts: Part ${idx + 1}`,
        summary: page.text.slice(0, 120) + '...',
        pageReferences: [page.pageNumber],
        keyTerms: extractKeywords(page.text),
        chunkIds: relatedChunks.map(c => c.id)
      });
    });
  }

  return topics;
}

/**
 * Extracts salient keywords from a text string.
 */
export function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'were', 'which',
    'where', 'when', 'what', 'their', 'there', 'about', 'would', 'could', 'these',
    'those', 'after', 'before', 'being', 'between', 'during', 'under', 'while'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w));

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

/**
 * Assemble a complete DocumentSource from extracted pages.
 */
export function createDocumentFromPages(
  title: string,
  fileName: string,
  fileType: 'pdf' | 'text' | 'image' | 'sample',
  fileSize: number,
  pages: PageContent[],
  quality: ProcessingQuality
): DocumentSource {
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const totalWords = pages.reduce((acc, p) => acc + p.wordCount, 0);
  const chunks = segmentPagesIntoChunks(pages, docId);
  const topics = identifyTopicsFromContent(pages, chunks, title);
  
  const summary = pages.length > 0 
    ? `${title} contains ${pages.length} page(s) and ${totalWords} words across ${topics.length} recognized topic sections.`
    : 'Empty study document.';

  return {
    id: docId,
    title,
    fileName,
    fileType,
    fileSize,
    uploadedAt: new Date().toISOString(),
    pageCount: pages.length,
    wordCount: totalWords,
    pages,
    topics,
    chunks,
    summary,
    processingQuality: quality
  };
}
