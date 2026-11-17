// Kintsu signup backend — Express demo for the 3rd evaluation.
// Signup page only: /api/users (local JSON file), /api/mongo/users (MongoDB),
// /api/external/users (public API fetch).
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Without this, req.body is empty and the signup form data never arrives.
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'users.json');

// A missing or broken JSON file means "no users yet", not a crash.
function readUsers() {
  try {
    return fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : [];
  } catch { return []; }
}
function writeUsers(users) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Health check: proves the server is up without touching data or the database.
app.get('/', (req, res) => {
  res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 ? 'connected' : 'not connected' });
});

app.get('/api/users', (req, res) => res.json(readUsers()));

app.get('/api/users/:id', (req, res) => {
  const user = readUsers().find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Same email as before? Update in place (keep id and createdAt, refresh lastLogin).
// New email? Add a new user with id 'usr_' + Date.now().
app.post('/api/users', (req, res) => {
  const { email, username } = req.body || {};
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'A valid email address is required' });

  const users = readUsers();
  const i = users.findIndex(u => u.email === email);
  if (i >= 0) {
    users[i] = { ...users[i], username: username || users[i].username, lastLogin: new Date().toISOString() };
    writeUsers(users);
    return res.json({ success: true, updated: true, user: users[i] });
  }
  const user = { id: 'usr_' + Date.now(), email, username: username || email.split('@')[0], createdAt: new Date().toISOString() };
  users.push(user);
  writeUsers(users);
  res.status(201).json({ success: true, created: true, user });
});

app.put('/api/users/:id', (req, res) => {
  const users = readUsers();
  const i = users.findIndex(u => u.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'User not found' });
  const { email, username } = req.body || {};
  if (email !== undefined && !email.includes('@')) return res.status(400).json({ error: 'A valid email address is required' });
  if (email !== undefined && email !== users[i].email && users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'That email is already registered' });
  }
  if (email !== undefined) users[i].email = email;
  if (username !== undefined) users[i].username = username;
  writeUsers(users);
  res.json({ success: true, user: users[i] });
});

app.delete('/api/users/:id', (req, res) => {
  const users = readUsers();
  const i = users.findIndex(u => u.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'User not found' });
  const [deleted] = users.splice(i, 1);
  writeUsers(users);
  res.json({ success: true, deleted });
});

// Server-side fetch of a public API (no key needed). A failed fetch is a 502, not a crash.
app.get('/api/external/users', async (req, res) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    if (!response.ok) return res.status(502).json({ error: 'External API returned status ' + response.status });
    res.json(await response.json());
  } catch (err) {
    res.status(502).json({ error: 'Could not reach the external API', detail: err.message });
  }
});

app.use('/api/mongo/users', require('./routes/mongoUsers'));

// The server must start even when MongoDB is down; the JSON routes keep working.
async function connectDb() {
  if (!process.env.DATABASE_URL) {
    console.log('MongoDB: DATABASE_URL is not set — Mongo routes will answer 503, JSON routes still work.');
    return;
  }
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB: connected');
  } catch (err) {
    console.log('MongoDB: connection failed —', err.message, '— Mongo routes will answer 503, JSON routes still work.');
  }
}

app.listen(PORT, () => {
  console.log('Kintsu signup server running at http://localhost:' + PORT);
  console.log('Open http://localhost:' + PORT + '/signup.html');
  connectDb();
});
