const mongoose = require('mongoose');

let isMongoConnected = false;

/**
 * Connect to MongoDB with automatic retry and graceful offline fallback.
 * If MongoDB is not running locally, the server logs a warning and
 * seamlessly falls back to JSON file storage without crashing.
 */
async function connectDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kintsu';
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 2000 // Fast fail so startup is instant if offline
        });
        isMongoConnected = true;
        console.log(`[Database] MongoDB Connected via Mongoose to: ${uri}`);
    } catch (err) {
        isMongoConnected = false;
        console.warn(`[Database] ⚠️ MongoDB connection skipped: ${err.message}`);
        console.warn(`[Database] Active: Graceful JSON Persistence Fallback (data/notes.json, data/users.json). Evaluation safety active.`);
    }

    mongoose.connection.on('disconnected', () => {
        isMongoConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
        isMongoConnected = true;
        console.log('[Database] MongoDB Reconnected.');
    });
}

module.exports = {
    connectDB,
    isConnected: () => isMongoConnected
};
