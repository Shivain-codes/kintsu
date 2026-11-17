// Same five CRUD operations as /api/users, stored in MongoDB instead of a JSON file.
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');

// Answer 503 when the database is down, so a dead MongoDB never crashes a request.
function dbReady(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database not connected. Set DATABASE_URL in .env and restart the server.' });
    return false;
  }
  return true;
}

router.get('/', async (req, res) => {
  if (!dbReady(res)) return;
  try { res.json(await User.find()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(400).json({ error: 'Invalid user id' }); }
});

router.post('/', async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const user = new User({ email: req.body.email, username: req.body.username || (req.body.email || '').split('@')[0] });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    // 11000 = MongoDB duplicate-key error: the email is already registered.
    if (err.code === 11000) return res.status(400).json({ error: 'That email is already registered' });
    res.status(400).json({ error: err.message });
  }
});

// runValidators re-checks the schema on update (e.g. email is still required).
router.put('/:id', async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, deleted: user });
  } catch (err) { res.status(400).json({ error: 'Invalid user id' }); }
});

module.exports = router;
