/**
 * Kintsu Flashcard Library
 * Loads stacks from localStorage (kintsu_flashcards), renders them,
 * updates STACKS / CARDS counts, filters by search and sorts by date or name.
 * With no stacks saved, the empty state stays visible, as in the prototype.
 */
let stacks = [];
const DEFAULT_STUDY_STACKS = [
    {
        id: "stack_transformers_01",
        title: "Transformers & Self-Attention",
        createdAt: "Today",
        createdAtRaw: Date.now(),
        cards: [
            { question: "What is Scaled Dot-Product Attention?", answer: "Attention(Q, K, V) = softmax(Q·Kᵀ / √dₖ) · V" },
            { question: "Why is scaling by √dₖ necessary?", answer: "To prevent dot products from growing excessively large in high dimensions, which would push softmax into regions with tiny gradients." },
            { question: "How does Multi-Head Attention differ from Single-Head?", answer: "It linearly projects queries, keys, and values h times into different subspaces, allowing the model to jointly attend to information from different representation spaces." }
        ]
    },
    {
        id: "stack_neural_nets_02",
        title: "Neural Network Activations",
        createdAt: "This week",
        createdAtRaw: Date.now() - (2 * 86400000),
        cards: [
            { question: "What is the formula for the Sigmoid activation function?", answer: "σ(z) = 1 / (1 + e⁻ᶻ)" },
            { question: "What problem does ReLU solve compared to Sigmoid?", answer: "ReLU helps alleviate the vanishing gradient problem for positive inputs since its derivative is a constant 1." },
            { question: "What is the Softmax function used for?", answer: "It normalizes raw logit scores into a valid probability distribution where all elements sum to 1.0." }
        ]
    }
];

try {
    const saved = JSON.parse(localStorage.getItem('kintsu_flashcards') || 'null');
    if (Array.isArray(saved) && saved.length > 0) {
        stacks = saved;
    } else {
        stacks = DEFAULT_STUDY_STACKS;
        localStorage.setItem('kintsu_flashcards', JSON.stringify(stacks));
    }
} catch (e) {
    stacks = DEFAULT_STUDY_STACKS;
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function groupLabel(date) {
    const d = new Date(date || 0);
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today); week.setDate(week.getDate() - 7);
    const month = new Date(today); month.setDate(month.getDate() - 30);
    if (d >= today) return "Today";
    if (d >= week) return "This week";
    if (d >= month) return "This month";
    return "Earlier";
}
let sortNewest = true;
let reviewStack = null, reviewIndex = 0, reviewFlipped = false;
function showReview() {
    if (!reviewStack || !reviewStack.cards || !reviewStack.cards.length) return;
    const card = reviewStack.cards[reviewIndex];
    document.getElementById("reviewStackTitle").textContent = reviewStack.title || "Review";
    document.getElementById("reviewSide").textContent = reviewFlipped ? "ANSWER" : "QUESTION";
    document.getElementById("reviewText").textContent = reviewFlipped ? (card.answer || card.back || "") : (card.question || card.front || "");
    document.getElementById("reviewProgress").textContent = (reviewIndex + 1) + " / " + reviewStack.cards.length;
    document.getElementById("reviewModal").style.display = "flex";
}
function renderStacks() {
    const grid = document.getElementById("stacksGrid");
    const empty = document.getElementById("emptyState");
    const noMatch = document.getElementById("noMatchState");
    const stackCount = document.getElementById("stackCount");
    const cardCount = document.getElementById("cardCount");
    if (!grid) return;
    const query = (document.getElementById("stackSearch")?.value || "").trim().toLowerCase();
    let filtered = stacks.filter(s => !query || (s.title || "").toLowerCase().includes(query));
    filtered = filtered.slice().sort((a, b) => sortNewest ? (b.createdAtRaw || b.createdAt || 0) - (a.createdAtRaw || a.createdAt || 0) : (a.createdAtRaw || a.createdAt || 0) - (b.createdAtRaw || b.createdAt || 0));
    const totalCards = stacks.reduce((sum, s) => sum + (Array.isArray(s.cards) ? s.cards.length : (s.cardCount || 0)), 0);
    if (stackCount) stackCount.textContent = String(stacks.length);
    if (cardCount) cardCount.textContent = String(totalCards);
    if (empty) empty.style.display = stacks.length === 0 ? "block" : "none";
    if (noMatch) {
        noMatch.style.display = stacks.length > 0 && filtered.length === 0 ? "block" : "none";
        const t = document.getElementById("noMatchText");
        if (t) t.textContent = 'No stacks match "' + (document.getElementById("stackSearch")?.value || "") + '".';
    }
    grid.innerHTML = "";
    const groups = { "Today": [], "This week": [], "This month": [], "Earlier": [] };
    filtered.forEach(s => groups[groupLabel(s.createdAtRaw || s.createdAt || Date.now())].push(s));
    Object.entries(groups).forEach(([label, items]) => {
        if (!items.length) return;
        const section = document.createElement("section");
        section.className = "group-section";
        section.innerHTML = '<div class="group-header"><h2>' + label + '</h2><span class="group-count">' + items.length + '</span><div class="group-line"></div></div><div class="stacks-grid"></div>';
        const inner = section.querySelector(".stacks-grid");
        items.forEach(s => {
            const count = Array.isArray(s.cards) ? s.cards.length : (s.cardCount || 0);
            const card = document.createElement("div");
            card.className = "stack-card";
            card.innerHTML = '<span class="stack-label">Study Deck</span><h3>' + escapeHtml(s.title || "Untitled stack") + '</h3>' +
                '<p>' + escapeHtml(s.createdAt || "") + '</p>' +
                '<div class="stack-actions"><span class="stack-count-pill">' + count + " " + (count === 1 ? "card" : "cards") + '</span>' +
                '<button type="button" class="btn-pink" data-study="' + escapeHtml(s.id || s.title || "") + '">Study</button>' +
                '<button type="button" class="btn-outline" data-delete="' + escapeHtml(s.id || s.title || "") + '">Delete</button></div>';
            inner.appendChild(card);
        });
        grid.appendChild(section);
    });
    grid.querySelectorAll("[data-study]").forEach(btn => {
        btn.onclick = () => {
            const s = stacks.find(x => (x.id || x.title) === btn.dataset.study);
            if (!s || !(s.cards && s.cards.length)) { alert("This stack has no cards yet."); return; }
            reviewStack = s; reviewIndex = 0; reviewFlipped = false; showReview();
        };
    });
    grid.querySelectorAll("[data-delete]").forEach(btn => {
        btn.onclick = () => {
            if (!confirm("Delete this stack and all its cards?")) return;
            stacks = stacks.filter(x => (x.id || x.title) !== btn.dataset.delete);
            try { localStorage.setItem("kintsu_flashcards", JSON.stringify(stacks)); } catch (e) {}
            renderStacks();
        };
    });
}

function initLibrary() {
    const user = JSON.parse(localStorage.getItem('kintsu_user') || '{}');
    if (user.email) {
        const tag = document.getElementById('userEmailTag');
        if (tag) tag.textContent = user.email;
    }
    const themeBtn = document.getElementById('flashThemeToggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const isDark = document.body.classList.toggle('dark');
            localStorage.setItem('kintsu_theme', isDark ? 'dark' : 'light');
        };
    }
    const signOut = document.getElementById('signOutBtn');
    if (signOut) {
        signOut.onclick = () => {
            localStorage.removeItem('kintsu_user');
            window.location.href = 'signin.html';
        };
    }
    const search = document.getElementById('stackSearch');
    if (search) search.addEventListener('input', renderStacks);
    const sortBtn = document.getElementById('stackSortBtn');
    const sortLabel = document.getElementById('stackSortLabel');
    if (sortBtn) sortBtn.addEventListener('click', function () {
        sortNewest = !sortNewest;
        if (sortLabel) sortLabel.textContent = sortNewest ? 'NEWEST' : 'OLDEST';
        renderStacks();
    });
    document.querySelectorAll('.feedback-type').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.feedback-type').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const note = document.getElementById('feedbackNote');
            if (note) note.textContent = 'Thanks - feedback type selected: ' + btn.dataset.type;
        };
    });
    const range = document.getElementById('experienceRange');
    const value = document.getElementById('ratingValue');
    if (range && value) range.addEventListener('input', () => { value.textContent = range.value; });
    const closeReview = document.getElementById("reviewCloseBtn");
    if (closeReview) closeReview.onclick = () => { document.getElementById("reviewModal").style.display = "none"; };
    const flip = document.getElementById("reviewFlipBtn");
    if (flip) flip.onclick = () => { reviewFlipped = !reviewFlipped; showReview(); };
    const prev = document.getElementById("reviewPrevBtn");
    if (prev) prev.onclick = () => { if (reviewIndex > 0) { reviewIndex--; reviewFlipped = false; showReview(); } };
    const next = document.getElementById("reviewNextBtn");
    if (next) next.onclick = () => {
        if (reviewStack && reviewIndex < reviewStack.cards.length - 1) { reviewIndex++; reviewFlipped = false; showReview(); }
        else { document.getElementById("reviewModal").style.display = "none"; alert("Review complete!"); }
    };
    const msg = document.getElementById("feedbackMessage");
    const send = document.getElementById("feedbackSendBtn");
    if (msg && send) {
        msg.addEventListener("input", () => { send.disabled = !msg.value.trim(); });
        send.onclick = () => {
            const note = document.getElementById("feedbackNote");
            if (note) note.textContent = "Thanks \u2014 feedback received!";
            send.textContent = "Sent \u2014 send another?";
            msg.value = ""; send.disabled = true;
        };
    }
    const asEl = document.getElementById("feedbackAs");
    if (asEl && user.email) asEl.textContent = "Sending as " + user.email;
    renderStacks();
}

document.addEventListener('DOMContentLoaded', initLibrary);
