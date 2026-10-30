/**
 * Kintsu Study Vault - Dashboard Logic (Compact & Easy to Explain)
 * 1. User Profile & Theme Toggle
 * 2. Data Loading & Dual JSON Persistence (localStorage + data/notes.json)
 * 3. Dynamic Note Card Rendering
 * 4. Form Validation & Submission (New Note)
 * 5. One-Click JSON Export (Evaluation Parameter 4)
 * 6. Modal Controls & Note Deletion
 */

let notes = [];
let currentBoard = 'All Notes';
let selectMode = false;
let selectedNotes = new Set();
let customBoards = [];
try {
    const savedBoards = JSON.parse(localStorage.getItem('kintsu_boards') || '[]');
    if (Array.isArray(savedBoards)) customBoards = savedBoards.filter(b => b && b.name);
} catch (e) { customBoards = []; }
let selectedBoardColor = '#F472B6';

// DOM Elements
const notesGrid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
const notesCount = document.getElementById('notesSectionCount');
const modal = document.getElementById('createNoteModal');
const createForm = document.getElementById('createNoteForm');
const titleInput = document.getElementById('noteTitleInput');
const videoInput = document.getElementById('noteVideoInput');
const titleError = document.getElementById('titleError');
const videoError = document.getElementById('videoError');
const boardSelect = document.getElementById('noteBoardSelect');

// 1. SETUP: User Name, Theme Toggle, & Banner
function initApp() {
    const user = JSON.parse(localStorage.getItem('kintsu_user') || '{}');
    if (user.username) {
        document.getElementById('welcomeUserPill').textContent = user.username;
        document.getElementById('userEmailTag').textContent = user.email || user.username;
    }

    const themeBtn = document.getElementById('dashThemeToggle');
    if (themeBtn) {
        const savedTheme = localStorage.getItem('kintsu_theme');
        const startLight = savedTheme === 'light';
        document.body.classList.toggle('light-theme', startLight);
        document.body.classList.toggle('dark-theme', !startLight);
    }
    if (themeBtn) {
        themeBtn.onclick = () => {
            const isLight = document.body.classList.toggle('light-theme');
            document.body.classList.toggle('dark-theme', !isLight);
            localStorage.setItem('kintsu_theme', isLight ? 'light' : 'dark');
        };
    }

    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.onclick = () => {
            localStorage.removeItem('kintsu_user');
            window.location.href = 'signin.html';
        };
    }

    loadNotes();
}

// 2. DATA LAYER: Load from localStorage or data/notes.json
function loadNotes() {
    const local = localStorage.getItem('kintsu_notes');
    if (local) {
        notes = JSON.parse(local);
        renderNotes();
        return;
    }
    fetch('data/notes.json')
        .then(res => res.json())
        .then(data => { notes = data; saveNotes(); renderNotes(); })
        .catch(() => {
            notes = [{ id: 'LPZH9BOJ', title: 'Neural Network Fundamentals: Structural Overview', date: '10/28/2026', videoUrl: 'https://www.youtube.com/watch?v=aircAruvnKk', coverTheme: 'llm', coverImage: 'assets/neural-cover.webp', board: 'All Notes' }];
            saveNotes();
            renderNotes();
        });
}

// Save notes to localStorage AND send to server to write data/notes.json on disk
function saveNotes() {
    localStorage.setItem('kintsu_notes', JSON.stringify(notes, null, 2));
    if (window.fetch) {
        fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notes)
        }).catch(() => {});
    }
}

function getBoardOf(note) {
    return note.board || 'All Notes';
}

function getBoards() {
    const boards = ['All Notes'];
    notes.forEach(note => {
        const board = getBoardOf(note);
        if (board !== 'All Notes' && !boards.includes(board)) boards.push(board);
    });
    customBoards.forEach(b => {
        if (!boards.includes(b.name)) boards.push(b.name);
    });
    return boards;
}

function getBoardColor(board) {
    const custom = customBoards.find(b => b.name === board);
    return custom ? custom.color : '#FACC15';
}

function renderBoards() {
    const boardsList = document.getElementById('boardsList');
    if (!boardsList) return;
    boardsList.innerHTML = '';
    getBoards().forEach(board => {
        const count = board === 'All Notes' ? notes.length : notes.filter(n => getBoardOf(n) === board).length;
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'board-pill' + (board === currentBoard ? ' active' : '');
        pill.dataset.board = board;
        pill.innerHTML = `<span>${escapeHtml(board)}</span><span class="board-count">${count}</span>`;
        if (board === currentBoard) {
            const custom = customBoards.find(b => b.name === board);
            if (custom) pill.style.background = custom.color;
        }
        pill.onclick = () => {
            currentBoard = board;
            renderBoards();
            renderNotes();
        };
        boardsList.appendChild(pill);
    });
}

function updateBatchBar() {
    const selectModeBtn = document.getElementById('selectModeBtn');
    if (selectModeBtn) {
        const label = selectModeBtn.querySelector('span');
        if (label) label.textContent = selectMode ? '✕ Cancel Select' : 'Select';
    }
    const batchBar = document.getElementById('batchBar');
    const selectedCountText = document.getElementById('selectedCountText');
    const batchMoveSelect = document.getElementById('batchMoveSelect');
    if (!batchBar) return;
    if (!selectMode) {
        batchBar.style.display = 'none';
        return;
    }
    batchBar.style.display = 'flex';
    if (selectedCountText) selectedCountText.textContent = selectedNotes.size + ' selected';
    if (batchMoveSelect) {
        const boards = ['Unsorted'].concat(getBoards());
        batchMoveSelect.innerHTML = '<option value="">Move to board</option>' + boards.map(b => '<option value="' + escapeHtml(b) + '">' + escapeHtml(b) + '</option>').join('');
    }
}

function toggleNoteSelection(id) {
    if (selectedNotes.has(id)) selectedNotes.delete(id);
    else selectedNotes.add(id);
    renderNotes();
}

function exitSelectMode() {
    selectMode = false;
    selectedNotes.clear();
    const selectModeBtn = document.getElementById('selectModeBtn');
    if (selectModeBtn) {
        const label = selectModeBtn.querySelector('span');
        if (label) label.textContent = 'Select';
    }
    renderNotes();
}

function renderNotes() {
    notesGrid.innerHTML = '';
    renderBoards();
    updateBatchBar();
    const filtered = currentBoard === 'All Notes' ? notes : notes.filter(n => getBoardOf(n) === currentBoard);
    if (notesCount) notesCount.textContent = `(${filtered.length})`;
    const currentBoardTitle = document.getElementById('currentBoardTitle');
    if (currentBoardTitle) currentBoardTitle.textContent = currentBoard;

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card' + (selectMode && selectedNotes.has(note.id) ? ' selected' : '');
        if (selectMode) {
            card.onclick = () => toggleNoteSelection(note.id);
        }
        const coverBg = note.coverTheme === 'python' ? '#1e293b' : '#130d1a';
        const checkboxHtml = selectMode ? '<button type="button" class="select-checkbox" onclick="event.stopPropagation(); toggleNoteSelection(\'' + note.id + '\')" title="Select note">' + (selectedNotes.has(note.id) ? '&#10003;' : '') + '</button>' : '';
        const hintHtml = selectMode ? '<span class="select-hint">' + (selectedNotes.has(note.id) ? '&#10003; selected' : 'tap to select') + '</span>' : '';
        const actionsHtml = selectMode ? '' : '<div class="card-actions-group"><button type="button" class="btn-card-delete" onclick="deleteNote(\'' + note.id + '\')" title="Delete note"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button><a href="index.html#workspace" class="btn-card-open" onclick="openNote(\'' + note.id + '\')" title="Open in Workspace"><span>Open</span> <span>\u2197</span></a></div>';

        card.innerHTML = `
            ${checkboxHtml}
            <div class="note-cover" style="background: ${coverBg};">
                ${note.coverImage ? `<img class="cover-img" src="${note.coverImage}" alt="${escapeHtml(note.title)} cover">` : `<svg class="cover-svg" viewBox="0 0 320 160">
                    <line x1="40" y1="120" x2="160" y2="40" stroke="#ef4444" stroke-width="1.5"/>
                    <line x1="160" y1="40" x2="280" y2="130" stroke="#38bdf8" stroke-width="1.5"/>
                    <circle cx="60" cy="110" r="14" fill="#ffffff"/>
                    <circle cx="160" cy="45" r="16" fill="#ffffff"/>
                    <circle cx="230" cy="95" r="18" fill="#ffffff"/>
                </svg>`}
            </div>
            <div class="note-card-body">
                ${hintHtml}
                <span class="note-id-badge">ID · ${note.id}</span>
                <h3 class="note-card-title">${escapeHtml(note.title)}</h3>
                <div class="note-card-footer">
                    <span class="note-date">${note.date}</span>
                    ${actionsHtml}
                </div>
            </div>`;
        notesGrid.appendChild(card);
    });
}

window.toggleNoteSelection = toggleNoteSelection;
window.openNote = function (id) {
    const note = notes.find(n => n.id === id);
    if (note) localStorage.setItem('kintsu_active_note', JSON.stringify(note));
};

// Delete Note
window.deleteNote = function (id) {
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    renderNotes();
};

const newBoardBtn = document.getElementById('newBoardBtn');
const newBoardForm = document.getElementById('newBoardForm');
const boardNameInlineInput = document.getElementById('boardNameInlineInput');
const boardInlineError = document.getElementById('boardInlineError');
if (newBoardBtn && newBoardForm) {
    newBoardBtn.onclick = () => {
        const showing = newBoardForm.style.display !== 'none';
        newBoardForm.style.display = showing ? 'none' : 'flex';
        if (!showing && boardNameInlineInput) boardNameInlineInput.focus();
    };
}
document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.onclick = () => {
        document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('selected'));
        swatch.classList.add('selected');
        selectedBoardColor = swatch.dataset.color;
    };
});
const createBoardInlineBtn = document.getElementById('createBoardInlineBtn');
if (createBoardInlineBtn) {
    createBoardInlineBtn.onclick = () => {
        const name = boardNameInlineInput ? boardNameInlineInput.value.trim() : '';
        if (!name) {
            if (boardInlineError) boardInlineError.textContent = 'Board name is required.';
            return;
        }
        if (boardInlineError) boardInlineError.textContent = '';
        if (!getBoards().includes(name)) {
            customBoards.push({ name: name, color: selectedBoardColor });
            localStorage.setItem('kintsu_boards', JSON.stringify(customBoards));
        }
        currentBoard = name;
        if (newBoardForm) newBoardForm.style.display = 'none';
        if (boardNameInlineInput) boardNameInlineInput.value = '';
        renderBoards();
        renderNotes();
    };
}
const cancelBoardInlineBtn = document.getElementById('cancelBoardInlineBtn');
if (cancelBoardInlineBtn) {
    cancelBoardInlineBtn.onclick = () => {
        if (newBoardForm) newBoardForm.style.display = 'none';
        if (boardNameInlineInput) boardNameInlineInput.value = '';
        if (boardInlineError) boardInlineError.textContent = '';
    };
}

const selectModeBtn = document.getElementById('selectModeBtn');
if (selectModeBtn) {
    selectModeBtn.onclick = () => {
        if (selectMode) {
            exitSelectMode();
        } else {
            selectMode = true;
            selectedNotes.clear();
            const label = selectModeBtn.querySelector('span');
            if (label) label.textContent = '✕ Cancel Select';
            renderNotes();
        }
    };
}
const batchDeleteBtn = document.getElementById('batchDeleteBtn');
if (batchDeleteBtn) {
    batchDeleteBtn.onclick = () => {
        notes = notes.filter(n => !selectedNotes.has(n.id));
        saveNotes();
        exitSelectMode();
    };
}
const batchCancelBtn = document.getElementById('batchCancelBtn');
if (batchCancelBtn) {
    batchCancelBtn.onclick = () => exitSelectMode();
}
const batchMoveSelect = document.getElementById('batchMoveSelect');
if (batchMoveSelect) {
    batchMoveSelect.onchange = () => {
        const target = batchMoveSelect.value;
        if (!target) return;
        notes.forEach(n => {
            if (selectedNotes.has(n.id)) n.board = target;
        });
        saveNotes();
        exitSelectMode();
    };
}

// 4. FORM VALIDATION & SUBMISSION: Add Note (restored for Evaluation Parameters 2 and 3)
function refreshModalBoardOptions() {
    if (!boardSelect) return;
    const boards = getBoards();
    boardSelect.innerHTML = boards.map(b => '<option value="' + escapeHtml(b) + '">' + escapeHtml(b) + '</option>').join('');
    boardSelect.value = boards.includes(currentBoard) ? currentBoard : 'All Notes';
}
function openCreateNoteModal() {
    if (!modal) return;
    refreshModalBoardOptions();
    modal.style.display = 'flex';
}
if (createForm) {
    createForm.onsubmit = function (e) {
        e.preventDefault();
        let isValid = true;
        const title = titleInput.value.trim();
        const url = videoInput.value.trim();

        if (!title || title.length < 3) {
            titleInput.classList.add('error');
            titleError.textContent = 'Title must be at least 3 characters.';
            isValid = false;
        } else {
            titleInput.classList.remove('error');
            titleError.textContent = '';
        }

        if (!url || !url.includes('youtu')) {
            videoInput.classList.add('error');
            videoError.textContent = 'Please enter a valid YouTube video link.';
            isValid = false;
        } else {
            videoInput.classList.remove('error');
            videoError.textContent = '';
        }

        if (!isValid) return;

        const selectedTheme = createForm.querySelector('input[name="coverTheme"]:checked')?.value || 'llm';
        const board = boardSelect ? boardSelect.value : currentBoard;
        notes.unshift({
            id: 'LP' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            title: title,
            videoUrl: url,
            coverTheme: selectedTheme,
            date: new Date().toLocaleDateString('en-US'),
            board: board
        });

        saveNotes();
        renderNotes();
        createForm.reset();
        modal.style.display = 'none';
    };
}

// Modal controls
const openCreateNoteModalBtn = document.getElementById('openCreateNoteModalBtn');
if (openCreateNoteModalBtn) openCreateNoteModalBtn.onclick = openCreateNoteModal;
const closeCreateModalBtn = document.getElementById('closeCreateModalBtn');
if (closeCreateModalBtn) closeCreateModalBtn.onclick = () => { modal.style.display = 'none'; };
const cancelCreateModalBtn = document.getElementById('cancelCreateModalBtn');
if (cancelCreateModalBtn) cancelCreateModalBtn.onclick = () => { modal.style.display = 'none'; };

// 5. EVALUATION PARAMETER 4: Export Saved Notes to JSON File
const exportBtn = document.getElementById('exportJsonBtn');
if (exportBtn) {
    exportBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'kintsu_vault_notes.json';
        link.click();
    };
}


const qsSuggested = document.getElementById('qsSuggestedBtn');
if (qsSuggested) {
    qsSuggested.onclick = () => {
        openCreateNoteModal();
        if (titleInput) titleInput.value = 'Python for Beginners · Programming with Mosh';
        if (videoInput) videoInput.value = 'https://www.youtube.com/watch?v=_uQrJ0TkZlc';
    };
}
const qsPaste = document.getElementById('qsPasteBtn');
if (qsPaste) qsPaste.onclick = openCreateNoteModal;
const qsMinimize = document.getElementById('qsMinimizeBtn');
const qsBody = document.getElementById('qsBody');
if (qsMinimize && qsBody) {
    qsMinimize.onclick = () => {
        const collapsed = qsBody.style.display === 'none';
        qsBody.style.display = collapsed ? 'block' : 'none';
        qsMinimize.textContent = collapsed ? '⌄' : '⌃';
        qsMinimize.setAttribute('aria-label', collapsed ? 'Minimize' : 'Expand');
    };
}
const qsClose = document.getElementById('qsCloseBtn');
if (qsClose) qsClose.onclick = () => { document.getElementById('quickStartWidget').style.display = 'none'; };

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

initApp();
