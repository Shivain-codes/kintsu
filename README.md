# Kintsu · Neo-Brutalist Active-Recall Study Workspace & Vault

> **A3 End-Term Full-Stack Integration (BMU Web Dev Project)**  
> **Stack:** Vanilla HTML5 / CSS3 / JavaScript · Node.js · Express.js · MongoDB & Mongoose ODM · EJS Template Engine

---

## Quickstart & How to Run

### Prerequisites
- Node.js (v18 or higher recommended)
- *(Optional)* Local MongoDB daemon running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI in `.env`.  
  *(Note: If MongoDB is offline, Kintsu automatically falls back to local JSON persistence on disk without crashing!)*

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/agarwalpranav0711/kintsu.git
cd kintsu
npm install
```

### 2. Environment Configuration
Copy the sample environment file (or use defaults):
```bash
cp .env.example .env
```

### 3. Start the Server
```bash
npm start
# or for development:
node server.js
```

Open your browser to:
- **Home / Workspace:** [http://localhost:3333](http://localhost:3333)
- **Study Vault Dashboard:** [http://localhost:3333/dashboard.html](http://localhost:3333/dashboard.html)
- **Active-Recall Flashcards:** [http://localhost:3333/flashcards.html](http://localhost:3333/flashcards.html)
- **Server-Side Rendered EJS Analytics:** [http://localhost:3333/stats](http://localhost:3333/stats)
- **Sign In:** [http://localhost:3333/signin.html](http://localhost:3333/signin.html)
- **Create Account:** [http://localhost:3333/signup.html](http://localhost:3333/signup.html)

---

## A3 Full-Stack Architecture & Rubric Mapping

| Rubric Criteria | Weightage | Implementation in Kintsu |
| :--- | :---: | :--- |
| **Frontend–Backend Data Flow** | **15%** | Client `fetch()` requests connected to RESTful endpoints with full CRUD (Create, Read, Update/Pin, Delete) across Notes and Flashcards. |
| **Node.js / Express Setup** | **10%** | Express application (`server.js`) with modular controllers (`routes/notes.js`, `routes/users.js`, `routes/flashcards.js`), request logger middleware, CORS, and centralized error handling. |
| **Template Engines & Static Files** | **5%** | Native static asset serving (`express.static`) **plus** an **EJS** template engine view (`views/stats.ejs`) dynamically rendering live database analytics at runtime. |
| **MongoDB Operations via Mongoose/ODM** | **5%** | Mongoose ODM schemas & models (`models/Note.js`, `models/User.js`, `models/Flashcard.js`) with dual-mode graceful fallback to `data/*.json`. |
| **Innovation & Usability** | **5%** | Distinct Neo-Brutalist aesthetic, in-browser code sandbox runner, YouTube study synchronizer, active-recall flashcard deck review, and dark/light mode toggle. |

---

## REST API Reference

### 1. Study Notes API (`/api/notes`)
- `GET /api/notes`: Retrieve all saved notes (sorted by pinned status and timestamp).
- `POST /api/notes`: Create a new study note with server-side validation (title $\ge 3$ characters, YouTube URL format check).
- `PATCH /api/notes/:id/pin`: Toggle the pinned status of a study note.
- `DELETE /api/notes/:id`: Delete a note from MongoDB and the local filesystem backup.

### 2. User Authentication API (`/api/users`)
- `GET /api/users`: Fetch list of registered student accounts.
- `POST /api/users`: Upsert student profile `{ email, username }` into database on registration or login.

### 3. Flashcards API (`/api/flashcards`)
- `GET /api/flashcards`: Retrieve all generated active-recall decks.
- `POST /api/flashcards`: Persist newly generated flashcard pairs extracted from lecture notes.
- `DELETE /api/flashcards/:id`: Remove a flashcard by ID.

---

## Dual-Mode Persistence Architecture (Evaluation Safety)

```
                       ┌──────────────────────┐
                       │  Client (Frontend)   │
                       └──────────┬───────────┘
                                  │ Fetch API (JSON)
                                  ▼
                       ┌──────────────────────┐
                       │  Express.js Server   │
                       └──────────┬───────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
      [ MongoDB Available? ]             [ Evaluation Machine ]
         ├── YES: Mongoose ODM                 └── Write-through to
         │   (Note, User, Flashcard)               data/notes.json
         │   Models persisted to                   data/users.json
         │   mongodb://127.0.0.1:27017             data/flashcards.json
         └── NO: Graceful Fallback                 (Zero-crash guarantee!)
```

This guarantees that whether your teacher evaluates the project with MongoDB running or offline on a machine without database services, **the application runs with zero crashes and full functionality.**

---

## Contributors & Team Matrix

- **Pranav Agarwal** (`@agarwalpranav0711`) — **Project Lead**: Architecture, Express.js Backend, Mongoose ODM Integration, EJS Template Engine, Full-CRUD APIs, System Integration.
- **Aditya** (`@aditya2006magic`) — Code Execution Sandbox & Core Client Layout.
- **Pratishtha Vats** (`@PratishthaVats`) — Dashboard UI, Board Organization, & Navigation.
- **Shivain Gupta** (`@Shivain-codes`) — User Authentication UI (Sign in / Sign up) & Form Validation.
- **Ankit Kumar Yadav** (`@ankitkumaryadav02042006-gif`) — Flashcard Library UI & Active Recall Review Modal.
