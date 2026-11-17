/**
 * Kintsu Database Inspector CLI
 * Run: node view_db.js
 * Shows all collections and live documents stored in MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('./models/Note');
const User = require('./models/User');
const Flashcard = require('./models/Flashcard');

async function inspectDatabase() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kintsu';
    console.log('\n======================================================');
    console.log('🔍 Connecting to MongoDB database: kintsu...');
    console.log('🔗 Connection URI: ' + uri);
    console.log('======================================================\n');

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        console.log('✅ Successfully connected to MongoDB!\n');

        // 1. NOTES COLLECTION
        const notes = await Note.find().sort({ createdAt: -1 });
        console.log(`📁 Collection [notes] (${notes.length} documents):`);
        if (notes.length === 0) {
            console.log('   (No notes stored yet)');
        } else {
            notes.forEach((n, idx) => {
                console.log(`   [${idx + 1}] ID: ${n._id}`);
                console.log(`       Title:   ${n.title}`);
                console.log(`       Board:   ${n.board}`);
                console.log(`       Pinned:  ${n.pinned ? '📌 Yes' : 'No'}`);
                console.log(`       Video:   ${n.youtubeUrl || 'None'}`);
                console.log(`       Created: ${n.createdAt.toLocaleString()}`);
            });
        }

        // 2. USERS COLLECTION
        const users = await User.find();
        console.log(`\n📁 Collection [users] (${users.length} documents):`);
        if (users.length === 0) {
            console.log('   (No users registered yet)');
        } else {
            users.forEach((u, idx) => {
                console.log(`   [${idx + 1}] ID: ${u._id} | Email: ${u.email} | Username: ${u.username}`);
            });
        }

        // 3. FLASHCARDS COLLECTION
        const cards = await Flashcard.find();
        console.log(`\n📁 Collection [flashcards] (${cards.length} documents):`);
        if (cards.length === 0) {
            console.log('   (No flashcards stored yet)');
        } else {
            cards.forEach((c, idx) => {
                console.log(`   [${idx + 1}] Deck: [${c.deckTitle}]`);
                console.log(`       Q: ${c.question}`);
                console.log(`       A: ${c.answer}`);
            });
        }

        console.log('\n======================================================');
        console.log('💡 Tip: You can also view this in MongoDB Compass at:');
        console.log('   mongodb://localhost:27017 -> Database: kintsu');
        console.log('======================================================\n');

    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

inspectDatabase();
