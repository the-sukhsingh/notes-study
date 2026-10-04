# Study From My Notes

## 1. Project Overview

**Study From My Notes** is a local-first, AI-powered study companion that transforms a student's own learning material into an interactive revision experience.

A student imports PDFs, scanned pages, or images of notes. The app extracts the content, organizes it into understandable topics, and uses a locally running open-weight AI model to generate explanations, quizzes, flashcards, and personalized revision sessions.

The goal is not simply to summarize documents. It is to help a student **understand, remember, and test their knowledge using the material they already have**.

### The person it is built for

Build the first version for one real friend or student. Learn what subject they are studying, what makes revision difficult for them, and what kind of questions their exams use. Use their feedback to shape the experience instead of trying to support every possible learning style immediately.

### Core principles

- **Study from the source:** Use the student's own material as the primary source for generated content.
- **Learn actively:** Prioritize recall, practice, and explanations over passive summaries.
- **Local-first privacy:** Process study material and run AI locally wherever practical; clearly communicate any operation that requires a network connection.
- **Honest AI:** Make uncertainty visible and avoid presenting unsupported answers as facts.
- **Personalized revision:** Use quiz performance to help the student focus on concepts they find difficult.
- **Keep it approachable:** Make it easy to go from a document to a useful study session without configuring complicated AI tools.

---

## 2. Product Experience

The app should feel like a personal study workspace, not a generic chatbot with a file-upload button.

A student should be able to:

1. Open the app and see their study library.
2. Import a document or a set of notes.
3. Wait while the app processes the material locally.
4. Open the processed material and see its topics and available study actions.
5. Choose to understand, memorize, or test themselves.
6. Review results and revisit weak areas later.

Each document or collection of notes becomes a study source. The student can return to it and continue learning without repeating the entire setup process.

## 3. Main User Flow

### Step 1 — Add study material

The student imports a PDF or supported image files containing notes, textbook extracts, lecture handouts, or revision sheets.

Before processing, the app explains that the material will be handled on the device in local mode. It should show supported file types and reasonable size limits, and make it clear that scanned or handwritten pages may require OCR and may not be recognized perfectly.

### Step 2 — Process and understand the document

The app processes the imported material in stages:

1. **Extract text:** Read selectable text from PDFs.
2. **Recognize scanned content:** If pages are images, run local OCR to recognize text. Handwriting recognition should be treated as best-effort rather than guaranteed.
3. **Preserve source locations:** Keep page numbers and, where possible, links between extracted passages and their original pages.
4. **Clean and segment:** Remove extraction noise and split the material into meaningful sections without losing the surrounding context.
5. **Identify topics:** Ask the local model to suggest a clear outline of the material.
6. **Check processing quality:** Flag empty pages, unreadable sections, or extraction failures so the student can review them.

The app should not silently pretend that a poorly scanned document was processed successfully. It should let the student inspect the extracted text and correct obvious errors when needed.

### Step 3 — Create a study space

Once processing is complete, the app presents a study space for that material. It can include:

- A document viewer or extracted-text view.
- A topic outline for navigating the material.
- A short overview of the document.
- Actions to explain, generate flashcards, create a quiz, or start revision.
- Processing status and any warnings about incomplete or uncertain text.

The original material remains the reference point. AI-generated content should link back to the relevant page or passage whenever possible.

### Step 4 — Choose a learning mode

The student chooses what they want to do next:

- **Understand:** Get a simple explanation of a concept.
- **Memorize:** Practice flashcards and active recall.
- **Test:** Take a quiz generated from the material.
- **Revise:** Practice topics that previous sessions identified as difficult.
- **Ask:** Ask follow-up questions grounded in the uploaded notes.

These modes should share the same processed source, rather than independently re-reading and re-processing the entire document for every action.

---

## 4. Core Learning Features

### A. Explain My Notes

The student selects a topic, paragraph, or confusing concept and asks for an explanation.

They can request different levels of explanation, such as:

- Explain in simple language.
- Explain step by step.
- Give a practical example or analogy.
- Compare two related concepts.
- Explain as an exam answer.
- Ask me questions to check whether I understood.

The model should use the relevant passages from the student's material as its context. If the notes do not contain enough information to answer confidently, the app should say so. It may offer a clearly labeled general explanation if that option is enabled, but it must distinguish that explanation from what the uploaded notes actually say.

### B. Ask My Notes

This is a document-grounded question-and-answer experience.

1. The student asks a question.
2. The app searches the processed material for relevant passages.
3. The local model receives the question and those passages.
4. The model generates an answer based on the retrieved material.
5. The app shows page or passage references supporting the answer.
6. The student can open a reference to verify it in the original document.

If the evidence is weak or missing, the app should acknowledge the limitation instead of inventing a citation. Answers should be concise by default, with an option to expand the explanation.

### C. AI-Generated Flashcards

The student selects a document or topic and chooses how many flashcards to create.

Cards should test meaningful recall, not merely repeat sentences from the notes. Useful formats include:

- Concept → definition.
- Term → meaning.
- Question → explanation.
- Difference between two concepts.
- Process → ordered steps.
- Formula → meaning and use.
- Example → identify the underlying concept.

Each card should retain a reference to its source passage or page. The student can reveal the answer, mark whether they recalled it, and flag confusing or incorrect cards.

The student should be able to edit, regenerate, or delete a card. AI-generated content is a draft for learning, not an unquestionable answer key.

### D. Interactive Quizzes

The student chooses a topic, question count, difficulty, and question types where supported.

Possible question types:

- Multiple-choice questions.
- True or false.
- Fill in the blanks.
- Short-answer questions.
- Exam-style descriptive questions.

A quiz should run as a real assessment: show one question at a time or a clearly organized set, record the student's response, and reveal feedback at an appropriate point.

After an answer, the app should explain why it is correct or incorrect and show the supporting passage. For multiple-choice questions, distractors should be plausible but unambiguous. The app should avoid generating questions when the source material cannot support a reliable answer.

At the end, show the score, concepts answered incorrectly, explanations, and an option to retry only the missed questions.

### E. Smart Revision

The app uses the student's own study history to guide later practice.

It can track:

- Questions answered correctly or incorrectly.
- Flashcards marked easy or difficult.
- Topics repeatedly missed.
- Topics not practiced recently.
- Confidence reported by the student, if collected.

Use this information to suggest a short revision session. Revisit difficult material more frequently and let well-understood material appear less often. A simple spaced-repetition schedule is sufficient for the first version; sophisticated prediction is not required.

The app should explain why a topic is being recommended, such as “You missed two questions about informed search last time.”

### F. Progress and Study Sessions

A study session should have a clear beginning and end. At the end, summarize what was practiced, what went well, and what needs more work.

Progress indicators should support learning rather than pressure the student. Avoid presenting a single score as a complete measure of understanding. Let students reopen past sessions and review mistakes.

---

## 5. How the AI Should Work

### Local model runtime

The web interface runs in the browser, while a local runtime such as **Ollama** or **llama.cpp** runs a compatible open-weight model on the student's computer.

The app sends requests to that local runtime for tasks such as:

- Identifying topics and outlining notes.
- Explaining concepts.
- Generating flashcards.
- Creating quiz questions and answer explanations.
- Answering questions from retrieved passages.

Choose a model that is compatible with the runtime and has a license suitable for the project's intended use. Test it on the target computer: model quality, speed, context length, memory requirements, and structured-output reliability vary. The app should detect when the local runtime is unavailable and explain how to start or configure it.

### Retrieval-grounded answers

For a document question, the app should not send an entire large textbook to the model by default.

Instead:

1. Split extracted text into meaningful chunks.
2. Keep each chunk associated with its document and page.
3. Find the chunks most relevant to the student's question, using local keyword search, local embeddings, or a combination.
4. Send the question and selected passages to the model.
5. Ask the model to answer only as strongly as the evidence permits.
6. Show references that correspond to the retrieved passages.

A small first version can use local keyword search. Add local embeddings and a vector index only if they improve retrieval on real study material. Retrieval quality should be tested, because an incorrect or irrelevant passage can lead to a misleading answer even when the model itself is capable.

### Structured generation and validation

Where possible, ask the model to return a predictable structure for generated cards and questions. Validate the output before displaying it. Check that questions have the required fields, multiple-choice questions have a single intended correct answer, and source references point to real passages.

If generation fails or produces malformed output, retry in a limited way or show a useful error. Do not silently replace failed AI output with invented content.

### Local AI limitations

Local models can be slower or less capable than large hosted models, especially on low-memory computers. OCR may misread equations, tables, diagrams, and handwriting. AI may still make mistakes or generate ambiguous questions. The product should provide source verification, editing controls, and clear error states rather than promising perfect accuracy.

---

## 6. Privacy and Offline Behavior

Privacy is a core product feature, not just a marketing claim.

The intended local-first experience is:

- Study files are processed on the student's computer.
- Text extraction and OCR run locally where supported.
- AI inference uses the local model runtime.
- Search indexes, flashcards, quiz results, and study history are stored locally.
- No third-party AI API is required for the core learning workflow.

The interface must accurately distinguish between **local processing**, **internet-required features**, and **optional remote services**. Installing or downloading a model requires an initial network connection unless the model is already available. The app itself should not claim to work fully offline until the required model and dependencies are installed and tested.

For a browser-based app, account for the security and browser-permission implications of connecting to a local runtime. Configure allowed origins carefully, avoid exposing the model server to the public internet, and do not ask users to disable browser security. If reliable local-runtime integration becomes too awkward for a browser-only app, a desktop wrapper can be considered later.

Include controls to delete imported material, generated content, and local learning history. Avoid analytics or telemetry that could transmit study content. Explain clearly if any optional feature sends data outside the device.

---

## 7. Interface and Interaction Principles

The experience should be calm, focused, and suitable for long study sessions.

- Use a clear document library and a dedicated workspace for each source.
- Keep the original notes accessible while the student studies.
- Make the next action obvious without overwhelming the student with options.
- Show loading and progress states for document processing and AI generation.
- Let students inspect, edit, and remove generated content.
- Provide page references near answers, not hidden in a separate settings screen.
- Make errors actionable: explain whether the issue is an unreadable file, unavailable local model, slow inference, or failed generation.
- Support keyboard navigation and readable contrast.
- Avoid gamification that distracts from learning; use progress indicators only when they help students make decisions.

A useful workspace can combine a document/topic navigator, a main study area, and an optional question-and-answer panel. On smaller screens, prioritize reading and flashcard practice rather than trying to squeeze every panel into one view.

---

## 8. Weekend MVP Scope

The first version should be small enough to finish, test, and hand to a real friend.

### Must have

1. Import a text-based PDF.
2. Extract text locally and preserve page references.
3. Connect to a locally running open-weight model.
4. Generate a small set of flashcards from selected material.
5. Generate a quiz with answer feedback and explanations.
6. Answer questions using relevant passages from the document.
7. Display source references for generated answers where possible.
8. Store basic study history locally.
9. Show clear errors when the file or local model cannot be used.

### If time allows

- OCR for scanned PDFs.
- Editable generated flashcards.
- Topic-based quiz generation.
- A simple missed-question revision session.
- Local semantic search.
- Exporting flashcards or quiz results.

### Defer until later

- Mobile apps.
- Multi-user accounts and cloud sync.
- Social leaderboards.
- Complex agent workflows.
- Advanced handwriting recognition.
- Automatic processing of every document format.
- Claims of guaranteed correctness or perfect offline operation on every device.

The MVP should demonstrate one complete, reliable journey: **import notes → generate learning material → answer questions → review mistakes**.

---

## 9. Testing With the Friend

The project is being built for a person, so their experience should determine whether it works.

Before handing it over:

1. Ask for one real document they are comfortable using for testing.
2. Find out whether they need conceptual explanations, memorization, or exam practice most.
3. Process the document and inspect extraction quality.
4. Compare a sample of generated questions and answers with the original notes.
5. Ask the friend to complete a short quiz and use the explanations.
6. Observe where they get confused, wait too long, or distrust the output.
7. Fix the most important issue and let them try again.

Useful evaluation questions include:

- Did the app save time compared with making revision notes manually?
- Were the questions relevant to the actual material?
- Could the friend verify answers against the source?
- Did the explanations help them understand mistakes?
- Was local setup straightforward on their computer?
- What feature would they genuinely use again?

Do not invent testimonials or claim learning improvements without evidence. If the friend gives feedback, include their actual words—with permission—in the project write-up.

---

## 10. Why Open Innovation Matters

The project uses open-weight AI and local processing to give the student more control over their study material and learning workflow.

**Privacy and ownership:** Personal notes and study history can remain on the student's computer rather than being uploaded to a hosted AI provider.

**Model choice:** The model can be replaced with another compatible open-weight model as quality, speed, hardware, or licensing requirements change.

**Offline potential:** Once the model and required dependencies are installed, the core study workflow can operate without internet access, provided every required component is genuinely local.

**Cost control:** Core inference does not require a per-request hosted AI API fee. The trade-off is local hardware usage, model downloads, setup, and potentially slower responses.

**Transparency and adaptability:** The developer can inspect and change prompts, retrieval logic, validation, and learning behavior rather than relying entirely on a closed service's fixed interface.

Be precise in the project write-up: open weights do not automatically mean fully open-source licensing, and a local model does not guarantee that every part of the application is private or offline. Those claims depend on the selected licenses, dependencies, configuration, and tested behavior.

---

## 11. Suggested Demo Flow

A concise demo should show the complete experience instead of only a polished dashboard:

1. Open the app and show that the local model is ready.
2. Import a sample PDF and show local processing.
3. Open a topic and generate flashcards.
4. Answer a quiz question and reveal the explanation.
5. Ask a question and open the supporting page reference.
6. Deliberately miss a question and show how it appears in revision.
7. Explain which components run locally and demonstrate offline behavior if it has been verified.

The demo should use real outputs and make any limitations visible.

## 12. Project Success Criteria

The project is successful when the friend can independently import their own notes, generate useful study material, verify answers against the source, and return to difficult concepts without needing a paid cloud AI service.

The guiding product question is:

**Does this help my friend learn their actual course material more effectively, while giving them more control over their data?**

If the answer is yes, the project has delivered its purpose.
