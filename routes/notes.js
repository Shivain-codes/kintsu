const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Note = require('../models/Note');
const { isConnected } = require('../config/db');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

function readNotesFromFile() {
    try {
        if (!fs.existsSync(NOTES_FILE)) return [];
        const raw = fs.readFileSync(NOTES_FILE, 'utf8');
        return JSON.parse(raw || '[]');
    } catch (e) {
        return [];
    }
}

function writeNotesToFile(notes) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf8');
    } catch (e) {
        console.error('[Storage] Error writing to notes.json:', e);
    }
}

router.get('/', async (req, res) => {
    try {
        if (isConnected()) {
            const mongoNotes = await Note.find().sort({ pinned: -1, createdAt: -1 });
            return res.json({ success: true, count: mongoNotes.length, source: 'mongodb', data: mongoNotes });
        }
        const fileNotes = readNotesFromFile();
        fileNotes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        res.json({ success: true, count: fileNotes.length, source: 'json-fallback', data: fileNotes });
    } catch (err) {
        console.error('[Notes API] GET Error:', err);
        const fallback = readNotesFromFile();
        res.json({ success: true, count: fallback.length, source: 'fallback', data: fallback });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, subject, body, board, color, tags, youtubeUrl, pinned } = req.body;

        if (!title || typeof title !== 'string' || title.trim().length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Validation Error: Title is required and must be at least 3 characters.'
            });
        }

        if (youtubeUrl && typeof youtubeUrl === 'string' && youtubeUrl.trim() !== '') {
            const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
            if (!ytRegex.test(youtubeUrl.trim())) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation Error: Please provide a valid YouTube video link.'
                });
            }
        }

        let newNote = null;

        if (isConnected()) {
            newNote = await Note.create({
                title: title.trim(),
                subject: subject ? subject.trim() : 'General',
                body: body || '',
                board: board || 'All Notes',
                color: color || '#FFF2FB',
                tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
                youtubeUrl: youtubeUrl ? youtubeUrl.trim() : '',
                pinned: Boolean(pinned)
            });
        } else {
            newNote = {
                id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                title: title.trim(),
                subject: subject ? subject.trim() : 'General',
                body: body || '',
                board: board || 'All Notes',
                color: color || '#FFF2FB',
                tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
                youtubeUrl: youtubeUrl ? youtubeUrl.trim() : '',
                pinned: Boolean(pinned),
                createdAt: new Date().toISOString()
            };
        }

        const fileNotes = readNotesFromFile();
        fileNotes.unshift(newNote);
        writeNotesToFile(fileNotes);

        res.status(201).json({
            success: true,
            message: 'Note created successfully!',
            data: newNote
        });
    } catch (err) {
        console.error('[Notes API] POST Error:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error: ' + err.message });
    }
});

router.patch('/:id/pin', async (req, res) => {
    try {
        const id = req.params.id;
        let updated = null;

        if (isConnected() && id.match(/^[0-9a-fA-F]{24}$/)) {
            const note = await Note.findById(id);
            if (note) {
                note.pinned = !note.pinned;
                await note.save();
                updated = note;
            }
        }

        const fileNotes = readNotesFromFile();
        const found = fileNotes.find(n => (n._id && n._id.toString() === id) || n.id === id);
        if (found) {
            found.pinned = !found.pinned;
            writeNotesToFile(fileNotes);
            if (!updated) updated = found;
        }

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, message: 'Note pin status updated', data: updated });
    } catch (err) {
        console.error('[Notes API] PATCH Pin Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let deleted = false;

        if (isConnected() && id.match(/^[0-9a-fA-F]{24}$/)) {
            const result = await Note.findByIdAndDelete(id);
            if (result) deleted = true;
        }

        const fileNotes = readNotesFromFile();
        const initialLength = fileNotes.length;
        const filtered = fileNotes.filter(n => (n._id && n._id.toString() !== id) && n.id !== id);
        if (filtered.length !== initialLength) {
            writeNotesToFile(filtered);
            deleted = true;
        }

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, message: 'Note deleted successfully', id });
    } catch (err) {
        console.error('[Notes API] DELETE Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
