const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const payload = options.body ? JSON.stringify(options.body) : null;
        const req = http.request({
            hostname: 'localhost',
            port: 3333,
            path: path,
            method: options.method || 'GET',
            headers: payload ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            } : {}
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
                resolve({ status: res.statusCode, data: parsed, raw: data });
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

test('1. Static Homepage Availability', async () => {
    const res = await request('/');
    assert.equal(res.status, 200);
    assert.match(res.raw, /<title>Kintsu/);
});

test('2. EJS Server-Side Rendered Metrics (/stats)', async () => {
    const res = await request('/stats');
    assert.equal(res.status, 200);
    assert.match(res.raw, /Platform Analytics/);
    assert.match(res.raw, /Server-Side Rendered with EJS Engine/);
});

test('3. Notes API - GET /api/notes', async () => {
    const res = await request('/api/notes');
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
});

test('4. Notes API - POST /api/notes Validation Rejection', async () => {
    const res = await request('/api/notes', {
        method: 'POST',
        body: { title: 'ab' } // Less than 3 chars
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.error, /Validation Error/);
});

test('5. Notes API - Complete Note CRUD Lifecycle', async () => {
    // Create
    const createRes = await request('/api/notes', {
        method: 'POST',
        body: {
            title: 'Automated Test Suite Note',
            subject: 'Unit Testing',
            board: 'Automated QA'
        }
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.data.success, true);
    const noteId = createRes.data.data._id || createRes.data.data.id;
    assert.ok(noteId, 'Note ID must be returned');

    // Pin Toggle
    const pinRes = await request(`/api/notes/${noteId}/pin`, { method: 'PATCH' });
    assert.equal(pinRes.status, 200);
    assert.equal(pinRes.data.success, true);

    // Delete
    const delRes = await request(`/api/notes/${noteId}`, { method: 'DELETE' });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.data.success, true);
});

test('6. Notes API - DELETE Nonexistent Note (404 Error Handling)', async () => {
    const res = await request('/api/notes/nonexistent_dummy_id_99999', { method: 'DELETE' });
    assert.equal(res.status, 404);
    assert.equal(res.data.success, false);
});

test('7. Users API - GET /api/users', async () => {
    const res = await request('/api/users');
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
});

test('8. Users API - POST /api/users Validation', async () => {
    const invalidRes = await request('/api/users', {
        method: 'POST',
        body: { email: 'invalid_email_format' }
    });
    assert.equal(invalidRes.status, 400);
    assert.equal(invalidRes.data.success, false);
});

test('9. Flashcards API - Complete CRUD Lifecycle', async () => {
    // Create
    const createRes = await request('/api/flashcards', {
        method: 'POST',
        body: {
            deckTitle: 'Automated QA Deck',
            question: 'What is Node.js?',
            answer: 'A JavaScript runtime environment.'
        }
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.data.success, true);
    const cardId = createRes.data.data[0]._id || createRes.data.data[0].id;
    assert.ok(cardId, 'Card ID must be returned');

    // Delete
    const delRes = await request(`/api/flashcards/${cardId}`, { method: 'DELETE' });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.data.success, true);
});

test('10. Live Compiler - JavaScript Execution', async () => {
    const res = await request('/api/compile', {
        method: 'POST',
        body: {
            code: 'console.log("TEST_PASS"); 10 * 5;',
            language: 'javascript'
        }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.match(res.data.output, /TEST_PASS/);
});

test('11. Live Compiler - Empty Input Validation', async () => {
    const res = await request('/api/compile', {
        method: 'POST',
        body: { code: '', language: 'javascript' }
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
});

test('12. Live Compiler - Python Execution', async () => {
    const res = await request('/api/compile', {
        method: 'POST',
        body: {
            code: 'print("PYTHON_AUTO_TEST_OK")',
            language: 'python'
        }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.match(res.data.output, /PYTHON_AUTO_TEST_OK/);
});

test('13. Notes API - Invalid YouTube URL Rejection', async () => {
    const res = await request('/api/notes', {
        method: 'POST',
        body: {
            title: 'Valid Note Title Here',
            youtubeUrl: 'https://vimeo.com/not-youtube-video'
        }
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.error, /YouTube/);
});

test('14. Notes API - Pin Toggle Both Directions (False -> True -> False)', async () => {
    // Create note
    const createRes = await request('/api/notes', {
        method: 'POST',
        body: { title: 'Two-Way Pin Toggle Test', subject: 'QA' }
    });
    assert.equal(createRes.status, 201);
    const noteId = createRes.data.data._id || createRes.data.data.id;

    // Pin: false -> true
    const pinRes1 = await request(`/api/notes/${noteId}/pin`, { method: 'PATCH' });
    assert.equal(pinRes1.status, 200);
    assert.equal(pinRes1.data.data.pinned, true);

    // Unpin: true -> false
    const pinRes2 = await request(`/api/notes/${noteId}/pin`, { method: 'PATCH' });
    assert.equal(pinRes2.status, 200);
    assert.equal(pinRes2.data.data.pinned, false);

    // Cleanup
    await request(`/api/notes/${noteId}`, { method: 'DELETE' });
});

test('15. Flashcards API - DELETE Nonexistent Card (404 Error Handling)', async () => {
    const res = await request('/api/flashcards/6afc5a987f40748ae07b9999', { method: 'DELETE' });
    assert.equal(res.status, 404);
    assert.equal(res.data.success, false);
});

test('16. Users API - Duplicate Registration Upsert Check', async () => {
    const email = 'duplicate_test_' + Date.now() + '@kintsu.edu';
    const res1 = await request('/api/users', {
        method: 'POST',
        body: { email: email, username: 'test1' }
    });
    assert.equal(res1.status, 200);

    // Upsert second time with same email
    const res2 = await request('/api/users', {
        method: 'POST',
        body: { email: email, username: 'test2_updated' }
    });
    assert.equal(res2.status, 200);
    assert.equal(res2.data.data.username, 'test2_updated');
});
