# KINTSU · Final Presentation (PPT) & Live Demo Script
**Evaluation:** A3 End Term Evaluation (40% Weightage)  
**Project:** Kintsu – Neo-Brutalist Active-Recall Study Workspace & Vault  
**Project Lead:** Pranav Agarwal (`agarwalpranav0711`)

---

## Part 1: Slide-by-Slide Presentation Structure (10 Slides)

### Slide 1: Title Slide
- **Title:** KINTSU (金継ぎ)
- **Subtitle:** Active-Recall Study Workspace & Lecture Vault
- **Stack:** HTML5 · CSS3 · Vanilla JS · Node.js · Express.js · MongoDB & Mongoose · EJS
- **Team:** Pranav Agarwal (Lead), Aditya, Pratishtha Vats, Shivain Gupta, Ankit Kumar Yadav
- **Institution:** BML Munjal University (BMU)

### Slide 2: Problem Statement & Motivation
- **Context Switching Cost:** Online students juggle 4+ tabs (YouTube, Notion, LeetCode/compiler, Quizlet/Anki).
- **The Friction:** Every switch degrades focus and increases cognitive fatigue.
- **The Solution:** Unify video player, timestamped notes, code execution compiler, and AI flashcards into a single browser viewport with high-contrast Neo-Brutalism.

### Slide 3: Neo-Brutalist Design Philosophy
- **Aesthetic Principles:** Raw, honest, modern web design inspired by modern developer platforms (Figma, Gumroad).
- **Styling Elements:** Thick 2px–3px black borders, pastel color accents (Mint `#2DD4A8`, Pink `#EC329F`, Butter-Yellow `#FEF9C3`), offset box shadows (`4px 4px 0 #000`), zero bloated CSS frameworks (100% native CSS3).
- **Theme Adaptability:** Full light and dark mode support using CSS custom properties (`var(--page-bg)`).

### Slide 4: Full-Stack Architecture & Data Flow
- **Presentation Layer:** Vanilla HTML5/CSS3/JS with responsive grids and DOM manipulation.
- **Application Layer:** Express.js REST API with modular routers (`/api/notes`, `/api/users`, `/api/flashcards`).
- **Data Layer:** MongoDB database via Mongoose ODM Schemas.
- **Fail-Safe Architecture:** Dual-mode persistence — automatically runs with live MongoDB; gracefully falls back to local JSON files if database services are unavailable during evaluation.

### Slide 5: Core Feature 1 — Study Vault Dashboard & Form Validation
- **Dynamic Grid:** Notes sorted by pinned status and timestamp with real-time counter badges.
- **Client & Server-Side Form Validation:**
  - Title length verification ($\ge 3$ characters).
  - YouTube URL regular expression validation.
  - Visual error styling with inline helper alerts.
- **Interactive Operations:** Instant Pin/Unpin, Card Deletion, JSON Export, and custom Board categorizations.

### Slide 6: Core Feature 2 — Lecture Workspace & Code Sandbox
- **Synchronized Video Player:** Embedded YouTube player with interactive timestamp stamps.
- **Embedded Code Sandbox:** Supports JavaScript, Python, C++, and Java syntax execution in an isolated runner with terminal output simulation.
- **Active-Recall AI Generation:** Select lecture text in real-time to generate 3 targeted question-and-answer study cards.

### Slide 7: Core Feature 3 — Flashcard Library & Review Modal
- **Active-Recall Study System:** Flashcard library organized by chronological stacks (Today, This Week, Earlier).
- **3D Flip Review Modal:** Keyboard and button-controlled 3D flip card review with question front and answer back.
- **Backend Synchronization:** Decks synced across browser `localStorage` and server-side MongoDB.

### Slide 8: Core Feature 4 — Server-Side Template Engine (EJS)
- **Live Metrics Dashboard (`/stats`):** Rendered entirely on the server via Express and EJS (`views/stats.ejs`).
- **Dynamic Content:** Server-calculated note count, user account count, active flashcard count, and real-time database connection status.
- **Demonstration:** Demonstrates server-side templating without client-side re-rendering overhead.

### Slide 9: Team Contribution Matrix
- **Pranav Agarwal (Lead - 40%):** Full-stack architecture, Express server, Mongoose models, EJS template engine, full CRUD REST API, and integration.
- **Aditya (20%):** In-browser code runner sandbox and workspace client layout.
- **Pratishtha Vats (15%):** Study Vault Dashboard UI, custom boards, and navigation pills.
- **Shivain Gupta (15%):** Authentication pages (Sign in / Sign up), client validation, and theme sync.
- **Ankit Kumar Yadav (10%):** Flashcard library page and review modal flip interaction.

### Slide 10: Conclusion & Future Scope
- **Conclusion:** Kintsu delivers a production-ready, zero-framework, full-stack active study platform exceeding all A3 rubric parameters.
- **Future Roadmap:** Real-time WebSockets collaborative study rooms, Google Gemini API live streaming, and Anki `.apkg` deck export.

---

## Part 2: Step-by-Step Live Demonstration Script for Teacher

Follow this exact 3-minute walkthrough during your live demonstration:

### Step 1: Start the Server (30 seconds)
1. Open PowerShell / Terminal in the project root:
   ```bash
   node server.js
   ```
2. Point to the terminal output:
   - *"Sir/Ma'am, as you can see, our Express server boots on port 3333."*
   - *"It logs `[Database] MongoDB Connected via Mongoose` when MongoDB is running, or gracefully indicates our dual-mode fallback, ensuring zero crashes."*

### Step 2: Showcase EJS Server-Side Rendering (45 seconds)
1. In the browser, navigate to: `http://localhost:3333/stats`
2. Explain to the teacher:
   - *"To satisfy the **Template Engine (5%)** rubric, we built `/stats` using **EJS** (`views/stats.ejs`)."*
   - *"This page is dynamically calculated and rendered entirely by the Node.js server before being sent to the client, showing real-time database counts for notes, flashcards, and users."*

### Step 3: Showcase Dashboard & Full CRUD Operations (60 seconds)
1. Click **Dashboard** in the navbar (`http://localhost:3333/dashboard.html`).
2. **Demonstrate Form Validation:**
   - Click **+ CREATE NOTE**.
   - Type `Hi` (2 letters) $\rightarrow$ Show the inline error: *"Title must be at least 3 characters."*
   - Type invalid video link `abc` $\rightarrow$ Show the error: *"Please enter a valid YouTube video link."*
3. **Demonstrate Create & Persistence:**
   - Type title: `Full-Stack Architecture Lecture Notes`.
   - Paste valid link: `https://www.youtube.com/watch?v=aircAruvnKk`.
   - Click **CREATE STUDY NOTE**.
   - Note appears instantly on the grid!
4. **Demonstrate Pin & Delete (Update/Delete):**
   - Click the 📌 icon to toggle pinning. Note re-sorts to the top.
   - Click the 🗑️ icon to delete a note. Show that the count decrements and the card vanishes.
   - Show terminal: Point to `[10:15:22] DELETE /api/notes/:id` confirming backend execution.

### Step 4: Showcase Flashcards & Code Sandbox (45 seconds)
1. Click **Workspace** in the navbar (`http://localhost:3333/index.html#live-demo`).
2. Highlight any sentence in the notes editor $\rightarrow$ Click **Yes** on *"Create AI Flashcard?"*.
3. Click **Flashcards** in the navbar (`http://localhost:3333/flashcards.html`).
4. Show the new deck created under **Today**, click **REVIEW DECK**, and flip the 3D card.
5. Conclude:
   - *"All code is 100% vanilla on the frontend with zero external UI frameworks, backed by a robust Express and Mongoose architecture meeting every evaluation parameter."*

---

## Part 3: Cheat Sheet — Answers to Tough Viva Questions

1. **Q: Why did you choose Mongoose over raw MongoDB driver?**  
   *A:* *"Mongoose provides schema-level validation, type casting, default values, and lifecycle hooks (`pre('save')`), ensuring data integrity before documents reach the database."*

2. **Q: How does your application handle MongoDB downtime?**  
   *A:* *"We architected a **Dual-Mode Graceful Fallback** in `config/db.js`. If MongoDB daemon is not running, the server detects the timeout, sets `isMongoConnected = false`, and seamlessly routes read/write operations to `data/notes.json` on disk without crashing."*

3. **Q: What template engine did you use, and how does it differ from client-side rendering?**  
   *A:* *"We used **EJS** (`views/stats.ejs`). Unlike client-side JavaScript that fetches JSON and populates the DOM via `innerHTML`, EJS compiles data into HTML on the server, sending ready-to-render markup directly to the client."*

4. **Q: What is your personal contribution as the lead developer?**  
   *A:* *"I architected the entire full-stack backend (Express.js, Mongoose ODM schemas, and EJS template engine), developed the RESTful CRUD endpoints (`/api/notes`, `/api/users`, `/api/flashcards`), integrated all modules, and lead the team with 34+ commits."*
