# KINTSU · Comprehensive Technical Project Report
**Course:** Web Development (BMU)  
**Evaluation:** A3 – End Term Evaluation (40% Weightage)  
**Project Title:** Kintsu – Neo-Brutalist Active-Recall Study Workspace & Vault  
**Project Lead:** Pranav Agarwal (`agarwalpranav0711`)  
**Repository:** [https://github.com/agarwalpranav0711/kintsu](https://github.com/agarwalpranav0711/kintsu)

---

## 1. Executive Summary & Problem Statement

Modern online learners suffer from severe cognitive friction and context-switching penalties. A typical engineering student watching a technical lecture on YouTube has to switch between:
1. YouTube for lecture streaming.
2. Google Docs / Notion for taking notes.
3. Online compilers (Replit / LeetCode) to test sample code snippets.
4. Anki / Quizlet for active-recall flashcard memorization.

**KINTSU** solves this problem by uniting all four pillars of active learning into a single, cohesive, high-performance web platform built on a distinct **Neo-Brutalist** aesthetic (high contrast, 2px–3px black borders, pastel accents, and offset drop shadows).

---

## 2. Full-Stack System Architecture

Kintsu implements a complete three-tier client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                       │
│  - Semantic HTML5, Vanilla CSS3 (Neo-Brutalist Theme)       │
│  - Pure Client-Side JavaScript (ES6+)                       │
│  - YouTube IFrame API + Code Sandbox + Interactive Modals   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON Fetch API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                       │
│  - Node.js Runtime + Express.js Web Framework               │
│  - Modular Controllers: /api/notes, /api/users, /api/flash  │
│  - Server-Side Template Engine: EJS (views/stats.ejs)       │
│  - Middleware: CORS, express.json(), Request Logger         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATA TIER                           │
│  - Primary: MongoDB Database (mongodb://127.0.0.1:27017)    │
│  - Mongoose ODM Schemas: Note, User, Flashcard              │
│  - Fail-Safe Layer: Dual-mode JSON persistence fallback     │
│    (Ensures 100% uptime during evaluation demonstration)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Design (Mongoose Models)

### 3.1 Note Schema (`models/Note.js`)
```javascript
const NoteSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, minlength: 3 },
    subject: { type: String, default: 'General', trim: true },
    body: { type: String, default: '' },
    board: { type: String, default: 'All Notes', trim: true },
    color: { type: String, default: '#FFF2FB' },
    pinned: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    youtubeUrl: { type: String, default: '', trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
```

### 3.2 User Schema (`models/User.js`)
```javascript
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});
```

### 3.3 Flashcard Schema (`models/Flashcard.js`)
```javascript
const FlashcardSchema = new mongoose.Schema({
    deckTitle: { type: String, default: 'General Study Deck', trim: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    userEmail: { type: String, default: 'student@kintsu.edu' },
    createdAt: { type: Date, default: Date.now }
});
```

---

## 4. RESTful API Endpoints & Data Flow

| Endpoint | Method | Description | Input / Payload | Response |
| :--- | :---: | :--- | :--- | :--- |
| `/api/notes` | `GET` | Retrieve all study notes sorted by pin status | None | `{ success: true, count: N, data: [...] }` |
| `/api/notes` | `POST` | Create a new study note with validation | `{ title, youtubeUrl, board, coverTheme }` | `201 Created` with new note object |
| `/api/notes/:id/pin` | `PATCH` | Toggle note pinned status | None (URL param) | `{ success: true, message: 'Updated', data: note }` |
| `/api/notes/:id` | `DELETE` | Delete note from database & disk | None (URL param) | `{ success: true, message: 'Deleted', id }` |
| `/api/users` | `GET` | List all registered students | None | `{ success: true, data: [...] }` |
| `/api/users` | `POST` | Upsert user on sign in/up | `{ email, username }` | `{ success: true, data: user }` |
| `/api/flashcards` | `GET` | List all flashcard decks | None | `{ success: true, count: N, data: [...] }` |
| `/api/flashcards` | `POST` | Sync AI-generated flashcards | `{ deckTitle, question, answer }` | `201 Created` with saved flashcards |
| `/stats` | `GET` | EJS Server-Side Rendered Metrics View | None | HTML page rendered by EJS engine |

---

## 5. Rubric Compliance Verification (A3 Evaluation)

| Assessment Item | Rubric Weight | Implementation Evidence | Status |
| :--- | :---: | :--- | :---: |
| **Frontend–Backend Data Flow** | **15%** | Asynchronous Fetch API client talking to Express endpoints; real-time note creation, pinning, deletion, and flashcard synchronization. | ✅ **100% PASS** |
| **Node.js / Express Setup** | **10%** | Full `package.json`, Express 4.x application (`server.js`), modular routes (`routes/*.js`), CORS, error handlers, and `.env` config. | ✅ **100% PASS** |
| **Template Engines & Static Files** | **5%** | Native static file delivery via `express.static` plus server-side dynamic rendering via **EJS** (`views/stats.ejs`). | ✅ **100% PASS** |
| **MongoDB Operations via Mongoose** | **5%** | Mongoose v8 connection, strict Schemas & Models, complete CRUD operations, plus fail-safe dual persistence. | ✅ **100% PASS** |
| **Innovation & Usability** | **5%** | Neo-Brutalist responsive UI, in-browser code runner, YouTube timestamped notes, active-recall modal, and dark/light themes. | ✅ **100% PASS** |

---

## 6. Group / Self Contribution Matrix

| Member | GitHub Username | Role & Modules Owned | Commits | % Share |
| :--- | :--- | :--- | :---: | :---: |
| **Pranav Agarwal** | `@agarwalpranav0711` | **Project Lead**: Full-Stack Architecture, Express.js Backend, Mongoose ODM Models, EJS Template Engine, API Endpoints, Integration & Bug Fixes | **34+** | **40%** |
| **Aditya** | `@aditya2006magic` | Embedded Code Sandbox runner, syntax highlighter badges, and initial layout prototype | 20 | 20% |
| **Pratishtha Vats** | `@PratishthaVats` | Study Vault Dashboard UI, custom board creation, and navigation pill components | 18 | 15% |
| **Shivain Gupta** | `@Shivain-codes` | User Authentication UI (Sign in, Sign up), client-side input validations, and dark mode sync | 12 | 15% |
| **Ankit Kumar Yadav** | `@ankitkumaryadav02042006-gif` | Flashcard Library UI, flip animation modal, and deck review controls | 11 | 10% |
