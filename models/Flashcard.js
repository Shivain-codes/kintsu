const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
    deckTitle: {
        type: String,
        default: 'General Study Deck',
        trim: true
    },
    question: {
        type: String,
        required: [true, 'Flashcard question is required'],
        trim: true
    },
    answer: {
        type: String,
        required: [true, 'Flashcard answer is required'],
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    userEmail: {
        type: String,
        default: 'student@kintsu.edu',
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Flashcard || mongoose.model('Flashcard', FlashcardSchema);
