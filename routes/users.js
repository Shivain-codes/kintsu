const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isConnected } = require('../config/db');

const { readUsersFromFile, writeUsersToFile, withoutPassword } = require('../config/userFile');
router.get('/', async (req, res) => {
    try {
        if (isConnected()) {
            const users = await User.find().select('-__v');
            return res.json({ success: true, count: users.length, data: users });
        }
        const fileUsers = readUsersFromFile();
        const safeUsers = fileUsers.map(withoutPassword);
        res.json({ success: true, count: safeUsers.length, data: safeUsers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

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

        const fileUsers = readUsersFromFile();
        const existingIdx = fileUsers.findIndex(u => u.email === email.toLowerCase().trim());
        if (existingIdx >= 0) {
            const plain = JSON.parse(JSON.stringify(savedUser));
            if (fileUsers[existingIdx].passwordHash) plain.passwordHash = fileUsers[existingIdx].passwordHash;
            fileUsers[existingIdx] = plain;
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

function findIndexById(users, id) {
    return users.findIndex(u => u.id === id || u._id === id);
}
router.put('/:id', (req, res) => {
    const users = readUsersFromFile();
    const i = findIndexById(users, req.params.id);
    if (i < 0) return res.status(404).json({ success: false, error: 'User not found' });
    const { email, username } = req.body || {};
    if (email !== undefined) {
        const cleanEmail = String(email).toLowerCase().trim();
        if (!cleanEmail.includes('@')) {
            return res.status(400).json({ success: false, error: 'Valid email is required.' });
        }
        if (users.some((u, idx) => idx !== i && u.email === cleanEmail)) {
            return res.status(400).json({ success: false, error: 'That email is already registered' });
        }
        users[i].email = cleanEmail;
    }
    if (username !== undefined) users[i].username = String(username).trim();
    writeUsersToFile(users);
    res.json({ success: true, data: withoutPassword(users[i]) });
});
router.delete('/:id', (req, res) => {
    const users = readUsersFromFile();
    const i = findIndexById(users, req.params.id);
    if (i < 0) return res.status(404).json({ success: false, error: 'User not found' });
    const [deleted] = users.splice(i, 1);
    writeUsersToFile(users);
    res.json({ success: true, deleted: withoutPassword(deleted) });
});
module.exports = router;
