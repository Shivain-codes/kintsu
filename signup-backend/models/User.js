const mongoose = require('mongoose');

// email is unique: MongoDB itself rejects a second user with the same email.
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
