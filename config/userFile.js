const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
function readUsersFromFile() {
    try {
        if (!fs.existsSync(USERS_FILE)) return [];
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
    } catch (e) {
        return [];
    }
}
function writeUsersToFile(users) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (e) {
        console.error('[Storage] Error writing users.json:', e);
    }
}
function withoutPassword(user) {
    if (!user) return user;
    const { passwordHash, ...safe } = user;
    return safe;
}
module.exports = { readUsersFromFile, writeUsersToFile, withoutPassword };
