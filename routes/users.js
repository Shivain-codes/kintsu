const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { isConnected } = require('../config/db');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function readUsersFromFile() {
    try {
        if (!fs.existsSync(USERS_FILE)) return [];
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
    } catch (e) {
        return [];
    }
}

function writeUsersToFile(users) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (e) {
        console.error('[Storage] Error writing users.json:', e);
    }
}

/**
 * @route   GET /api/users
 * @desc    Get all users
 */
router.get('/', async (req, res) => {
    try {
        if (isConnected()) {
            const users = await User.find().select('-__v');
            return res.json({ success: true, count: users.length, data: users });
        }
        const fileUsers = readUsersFromFile();
        res.json({ success: true, count: fileUsers.length, data: fileUsers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @route   POST /api/users
 * @desc    Register or record a user login
 */
router.post('/', async (req, res) => {
    try {
        const { email, username } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Valid email is required.' });
        }

        const safeUsername = username || email.split('@')[0];
        let savedUser = null;

        if (isConnected()) {
            savedUser = await User.findOneAndUpdate(
                { email: email.toLowerCase().trim() },
                { email: email.toLowerCase().trim(), username: safeUsername },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } else {
            savedUser = {
                id: 'usr_' + Date.now(),
                email: email.toLowerCase().trim(),
                username: safeUsername,
                createdAt: new Date().toISOString()
            };
        }

        // Keep local JSON in sync
        const fileUsers = readUsersFromFile();
        const existingIdx = fileUsers.findIndex(u => u.email === email.toLowerCase().trim());
        if (existingIdx >= 0) {
            fileUsers[existingIdx] = savedUser;
        } else {
            fileUsers.push(savedUser);
        }
        writeUsersToFile(fileUsers);

        res.status(200).json({ success: true, data: savedUser });
    } catch (err) {
        console.error('[Users API] POST Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
