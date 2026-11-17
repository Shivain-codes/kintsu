const express = require('express');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();
const User = require('../models/User');
const { isConnected } = require('../config/db');
const { readUsersFromFile, writeUsersToFile } = require('../config/userFile');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    return salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, stored) {
    const [salt, hash] = String(stored || '').split(':');
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, 'hex');
    const actual = crypto.scryptSync(password, salt, 64);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function cleanCredentials(body) {
    const email = String((body && body.email) || '').toLowerCase().trim();
    const password = String((body && body.password) || '');
    return { email, password };
}

async function findUser(email) {
    if (isConnected()) {
        const doc = await User.findOne({ email }).select('+passwordHash');
        if (doc) return { email: doc.email, username: doc.username, passwordHash: doc.passwordHash, googleId: doc.googleId };
    }
    return readUsersFromFile().find(u => u.email === email) || null;
}

async function saveUser(email, passwordHash, googleId) {
    const files = readUsersFromFile();
    const i = files.findIndex(u => u.email === email);
    const username = (i >= 0 && files[i].username) || email.split('@')[0];
    let record;
    if (isConnected()) {
        const doc = await User.findOneAndUpdate(
            { email },
            { $set: passwordHash ? { passwordHash } : { googleId }, $setOnInsert: { username } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        record = { _id: String(doc._id), email, username: doc.username, createdAt: doc.createdAt };
    } else {
        const old = i >= 0 ? files[i] : {};
        record = { id: old.id || 'usr_' + Date.now(), email, username, createdAt: old.createdAt || new Date().toISOString() };
    }
    if (i >= 0) record = { ...files[i], ...record };
    if (passwordHash) record.passwordHash = passwordHash;
    if (googleId) record.googleId = googleId;
    if (i >= 0) files[i] = record; else files.push(record);
    writeUsersToFile(files);
    return record;
}

router.post('/signup', async (req, res) => {
    try {
        const { email, password } = cleanCredentials(req.body);
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
        }
        if (password.length < 4) {
            return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
        }
        const existing = await findUser(email);
        if (existing && (existing.passwordHash || existing.googleId)) {
            return res.status(409).json({ success: false, code: 'ACCOUNT_EXISTS', error: 'An account with this email already exists. Please sign in.' });
        }
        const user = await saveUser(email, hashPassword(password));
        res.status(201).json({ success: true, data: { email: user.email, username: user.username } });
    } catch (err) {
        console.error('[Auth] signup error:', err);
        res.status(500).json({ success: false, error: 'Could not create the account.' });
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = cleanCredentials(req.body);
        if (!email || !email.includes('@') || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }
        const user = await findUser(email);
        if (!user) {
            return res.status(404).json({ success: false, code: 'NO_ACCOUNT', error: 'No account exists for this email.' });
        }
        if (!user.passwordHash && user.googleId) {
            return res.status(401).json({ success: false, code: 'GOOGLE_ACCOUNT', error: 'This account uses Google sign-in. Click Continue with Google.' });
        }
        if (!user.passwordHash) {
            return res.status(401).json({ success: false, code: 'NO_PASSWORD', error: 'This account has no password yet. Use Create account to set one.' });
        }
        if (!verifyPassword(password, user.passwordHash)) {
            return res.status(401).json({ success: false, code: 'BAD_PASSWORD', error: 'Incorrect password.' });
        }
        res.json({ success: true, data: { email: user.email, username: user.username } });
    } catch (err) {
        console.error('[Auth] signin error:', err);
        res.status(500).json({ success: false, error: 'Could not sign in.' });
    }
});

router.get('/google-client-id', (req, res) => {
    res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});

router.post('/google', async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return res.status(503).json({ success: false, error: 'Google sign-in is not configured on the server.' });
    }
    try {
        const credential = String((req.body && req.body.credential) || '');
        const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken: credential, audience: clientId });
        const payload = ticket.getPayload();
        if (!payload.email || !payload.email_verified) {
            return res.status(401).json({ success: false, error: 'Your Google email is not verified.' });
        }
        const email = payload.email.toLowerCase().trim();
        let user = await findUser(email);
        if (!user || (!user.passwordHash && !user.googleId)) {
            await saveUser(email, null, payload.sub);
            user = await findUser(email);
        }
        res.json({ success: true, data: { email: user.email, username: user.username } });
    } catch (err) {
        console.error('[Auth] google error:', err.message);
        res.status(401).json({ success: false, error: 'Google sign-in failed. Please try again.' });
    }
});

module.exports = router;
