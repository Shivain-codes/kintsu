/**
 * KINTSU Full-Stack Application Server
 * Framework: Express.js (A3 Evaluation Setup)
 * ODM / Database: Mongoose / MongoDB with automatic JSON persistence fallback
 * Template Engine: EJS
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { connectDB, isConnected } = require('./config/db');
const Note = require('./models/Note');
const User = require('./models/User');
const Flashcard = require('./models/Flashcard');

const app = express();
const PORT = process.env.PORT || 3333;

// Initialize Database connection (asynchronous, non-blocking)
connectDB();

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// ─── Template Engine (EJS) ──────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Server-Side Rendered View: Platform Metrics & Health
app.get('/stats', async (req, res) => {
    try {
        let notes = [];
        let users = [];
        let flashcards = [];

        if (isConnected()) {
            notes = await Note.find().sort({ createdAt: -1 }).lean();
            users = await User.find().lean();
            flashcards = await Flashcard.find().lean();
        } else {
            // Read from JSON fallback
            const readJson = (file) => {
                const p = path.join(__dirname, 'data', file);
                try {
                    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8') || '[]') : [];
                } catch (e) {
                    return [];
                }
            };
            notes = readJson('notes.json');
            users = readJson('users.json');
            flashcards = readJson('flashcards.json');
        }

        res.render('stats', {
            title: 'Platform Analytics',
            notes,
            users,
            flashcards,
            dbConnected: isConnected()
        });
    } catch (err) {
        console.error('[EJS Error]', err);
        res.status(500).send('Error rendering metrics dashboard: ' + err.message);
    }
});

// ─── Modular API Routes ─────────────────────────────────────────────────────
app.use('/api/notes', require('./routes/notes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/compile', require('./routes/compile'));
// External API: fetch public users and pass them through, so the page works
// even when the browser blocks cross-origin calls. A failed fetch is a 502, not a crash.
app.get('/api/external/users', async (req, res) => {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        if (!response.ok) return res.status(502).json({ success: false, error: 'External API returned status ' + response.status });
        res.json({ success: true, data: await response.json() });
    } catch (err) {
        res.status(502).json({ success: false, error: 'Could not reach the external API', detail: err.message });
    }
});


// ─── Static Files & Frontend Routing ─────────────────────────────────────────
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack || err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 KINTSU Full-Stack Server running at: http://localhost:${PORT}`);
        console.log(`📦 Architecture: Express.js + Mongoose/MongoDB + EJS Engine`);
        console.log(`📊 EJS Metrics Dashboard: http://localhost:${PORT}/stats`);
        console.log(`======================================================\n`);
    });
}

module.exports = app;
