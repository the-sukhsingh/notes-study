# Study From My Notes

**Study From My Notes** is a local-first, AI-powered study companion that transforms a student's own learning materials into an interactive, active-recall revision experience.

Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4, following tactile Apple Design and minimal, distraction-free principles.

---

## Core Principles

- **Study from the source:** Content is strictly grounded in the student's own notes, with verbatim citations and page numbers.
- **Learn actively:** Focuses on active recall, spaced repetition, and practice quizzes over passive reading.
- **Local-first privacy:** PDF parsing and AI intelligence run 100% on the student's device. No notes, telemetry, or personal data leave the machine.
- **Honest AI:** Transparent confidence levels and zero hallucinated citations. If notes lack evidence, the app explicitly states the limitation.
- **Personalized revision:** Recommends focused review based on missed quiz questions and flashcard difficulty ratings.

---

## Features

### 1. Document Extraction & Quality Auditor
- Import text-based PDFs, `.txt`, `.md`, or paste lecture notes directly.
- On-device text extraction using `pdfjs-dist` preserving page boundaries and word counts.
- Extraction quality auditor flags empty or scanned pages and allows page-by-page text inspection and editing.
- Pre-loaded with 3 sample courses for immediate testing (Search Algorithms, Action Potentials, Market Structures).

### 2. Five Core Learning Modes
1. **Source Notes Reader:** In-document search, page tabs, text copy, and quick-action passage explainers.
2. **Explain My Notes:** Explanations in 6 distinct pedagogical styles:
   - *Simple Language (Feynman Technique)*
   - *Step by Step*
   - *Practical Analogy*
   - *Compare & Contrast*
   - *Exam Model Answer*
   - *Socratic Challenge (Check recall)*
3. **Ask My Notes:** Document-grounded Q&A with relevance scoring, confidence indicators, and clickable page jumps.
4. **Active Recall Flashcards:** 3D tactile flip card with Spaced Repetition grading (`Again`, `Hard`, `Good`, `Easy`), keyboard shortcuts (`Space` to flip, `1-4` to rate), and in-place editing.
5. **Interactive Quizzes:** Multiple-choice and True/False questions with plausible distractors, immediate explanations quoting source passages, and a one-click **"Retry Missed Questions Only"** flow.
6. **Smart Revision Queue:** Intelligent recommendation queue analyzing past quiz mistakes and overdue flashcards.

### 3. Dual AI Intelligence Architecture
- **Built-in Offline Engine:** Fast, zero-setup, deterministic extractive NLP that works 100% offline in browser without external dependencies.
- **Local Ollama Support:** Connects to locally running open-weight models (`llama3.2`, `mistral`, `phi3`, `qwen2.5`) at `http://localhost:11434` with structured JSON generation.

### 4. Local-First Data Management
- All documents, decks, and quiz histories stored in browser `localStorage`.
- Full backup export and restore via JSON.
- Purge and data reset controls.

---

## Getting Started

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using Local Ollama (Optional)

If you'd like to use a local LLM instead of the built-in offline engine:

1. Install and start [Ollama](https://ollama.com).
2. Pull a recommended model:
   ```bash
   ollama run llama3.2
   ```
3. In the app, click the **"100% Local"** badge in the top navigation bar, select **"Ollama Local Model"**, and click **"Test Link"**.

---

## Keyboard Shortcuts

- **Flashcards:**
  - `Space`: Flip card (reveal answer / prompt)
  - `Left Arrow` / `Right Arrow`: Previous / Next card
  - `1`: Rate "Again" (1 day review)
  - `2`: Rate "Hard" (2 day review)
  - `3`: Rate "Good" (4 day review)
  - `4`: Rate "Easy" (7 day review)
