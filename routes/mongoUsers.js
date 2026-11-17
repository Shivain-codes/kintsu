const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isConnected } = require('../config/db');

// Answer 503 when the database is down, so a dead MongoDB never crashes a request.
function dbReady(res) {
    if (!isConnected()) {
        res.status(503).json({ success: false, error: 'Database not connected. Set MONGODB_URI in .env and restart.' });
        return false;
    }
    return true;
}

router.get('/', async (req, res) => {
    if (!dbReady(res)) return;
    try { res.json({ success: true, data: await User.find().select('-__v') }); }
    catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id', async (req, res) => {
    if (!dbReady(res)) return;
    try {
        const user = await User.findById(req.params.id).select('-__v');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) { res.status(400).json({ success: false, error: 'Invalid user id' }); }
});

router.post('/', async (req, res) => {
    if (!dbReady(res)) return;
    try {
        const { email, username } = req.body || {};
        const user = await User.create({ email, username: username || (email || '').split('@')[0] });
        res.status(201).json({ success: true, data: user });
    } catch (err) {
        // 11000 = duplicate key: the email is already registered.
        if (err.code === 11000) return res.status(400).json({ success: false, error: 'That email is already registered' });
        res.status(400).json({ success: false, error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    if (!dbReady(res)) return;
    try {
        const { email, username } = req.body || {};
        const update = {};
        if (email !== undefined) update.email = email;
        if (username !== undefined) update.username = username;
        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ success: false, error: 'That email is already registered' });
        res.status(400).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    if (!dbReady(res)) return;
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, deleted: user });
    } catch (err) { res.status(400).json({ success: false, error: 'Invalid user id' }); }
});

module.exports = router;
