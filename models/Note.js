const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Note title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters']
    },
    subject: {
        type: String,
        default: 'General',
        trim: true
    },
    body: {
        type: String,
        default: ''
    },
    board: {
        type: String,
        default: 'All Notes',
        trim: true
    },
    color: {
        type: String,
        default: '#FFF2FB'
    },
    pinned: {
        type: Boolean,
        default: false
    },
    tags: {
        type: [String],
        default: []
    },
    youtubeUrl: {
        type: String,
        default: '',
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

NoteSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.models.Note || mongoose.model('Note', NoteSchema);
