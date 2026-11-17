const mongoose = require('mongoose');

let isMongoConnected = false;

async function connectDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kintsu';
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 8000
        });
        isMongoConnected = true;
        console.log(`[Database] MongoDB connected`);
    } catch (err) {
        isMongoConnected = false;
        console.warn(`[Database] MongoDB connection skipped: ${err.message}`);
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
