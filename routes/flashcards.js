const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Flashcard = require('../models/Flashcard');
const { isConnected } = require('../config/db');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FLASHCARDS_FILE = path.join(DATA_DIR, 'flashcards.json');

function readFlashcardsFromFile() {
    try {
        if (!fs.existsSync(FLASHCARDS_FILE)) return [];
        return JSON.parse(fs.readFileSync(FLASHCARDS_FILE, 'utf8') || '[]');
    } catch (e) {
        return [];
    }
}

function writeFlashcardsToFile(cards) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify(cards, null, 2), 'utf8');
    } catch (e) {
        console.error('[Storage] Error writing flashcards.json:', e);
    }
}

router.get('/', async (req, res) => {
    try {
        if (isConnected()) {
            const cards = await Flashcard.find().sort({ createdAt: -1 });
            return res.json({ success: true, count: cards.length, source: 'mongodb', data: cards });
        }
        const fileCards = readFlashcardsFromFile();
        res.json({ success: true, count: fileCards.length, source: 'json-fallback', data: fileCards });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const payload = req.body;
        const incomingCards = Array.isArray(payload) ? payload : (payload.cards || [payload]);

        if (!incomingCards || incomingCards.length === 0) {
            return res.status(400).json({ success: false, error: 'No flashcard data provided' });
        }

        const savedCards = [];
        const fileCards = readFlashcardsFromFile();

        for (const c of incomingCards) {
            if (!c.question || !c.answer) continue;

            if (isConnected()) {
                const cardDoc = await Flashcard.create({
                    deckTitle: c.deckTitle || payload.deckTitle || 'General Study Deck',
                    question: c.question,
                    answer: c.answer,
                    difficulty: c.difficulty || 'medium',
                    userEmail: c.userEmail || 'student@kintsu.edu'
                });
                savedCards.push(cardDoc);
            } else {
                const cardObj = {
                    id: 'fc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                    deckTitle: c.deckTitle || payload.deckTitle || 'General Study Deck',
                    question: c.question,
                    answer: c.answer,
                    difficulty: c.difficulty || 'medium',
                    userEmail: c.userEmail || 'student@kintsu.edu',
                    createdAt: new Date().toISOString()
                };
                savedCards.push(cardObj);
            }
        }

        fileCards.unshift(...savedCards);
        writeFlashcardsToFile(fileCards);

        res.status(201).json({
            success: true,
            message: `${savedCards.length} flashcard(s) saved successfully!`,
            data: savedCards
        });
    } catch (err) {
        console.error('[Flashcards API] POST Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let deleted = false;

        if (isConnected() && id.match(/^[0-9a-fA-F]{24}$/)) {
            const result = await Flashcard.findByIdAndDelete(id);
            if (result) deleted = true;
        }

        const fileCards = readFlashcardsFromFile();
        const initial = fileCards.length;
        const filtered = fileCards.filter(c => (c._id && c._id.toString() !== id) && c.id !== id);
        if (filtered.length !== initial) {
            writeFlashcardsToFile(filtered);
            deleted = true;
        }

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Flashcard not found' });
        }

        res.json({ success: true, message: 'Flashcard deleted successfully', id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
