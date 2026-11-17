const body = document.body, toggle = document.getElementById('darkToggle');
if (localStorage.getItem('kintsu_theme') === 'dark') { body.classList.add('dark'); if (toggle) toggle.textContent = '☀️'; }
if (toggle) toggle.onclick = () => {
    const isDark = body.classList.toggle('dark');
    toggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('kintsu_theme', isDark ? 'dark' : 'light');
};

const demoCard = document.getElementById('demoCard');
if (demoCard) {
    demoCard.onclick = () => demoCard.classList.toggle('flipped');
    demoCard.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); demoCard.classList.toggle('flipped'); } };
}

const wsWindow = document.getElementById('workspaceWindow');
if (wsWindow) {
    document.querySelectorAll('.ws-view-btn').forEach(b => b.onclick = () => {
        document.querySelectorAll('.ws-view-btn').forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        wsWindow.className = 'workspace-window mode-' + b.dataset.mode;
    });

    const ytInput = document.getElementById('ytUrlInput'), embedBtn = document.getElementById('ytEmbedBtn'), ytPlayer = document.getElementById('ytPlayer'), timeDisplay = document.getElementById('ytTimeDisplay');
    let curVideoId = 'LPZh9BOjkQs';
    const parseYt = u => (u.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([\w-]{11})/) || [0, u.length === 11 ? u : null])[1];
    const loadVideo = (id, s = 0) => { curVideoId = id; ytPlayer.src = `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&rel=0&autoplay=1${s ? '&start=' + s : ''}`; };
    const seekTo = s => {
        if (timeDisplay) timeDisplay.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        try { ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [s, true] }), '*'); } catch (e) { loadVideo(curVideoId, s); }
    };

    if (embedBtn && ytInput) {
        embedBtn.onclick = () => {
            const id = parseYt(ytInput.value.trim());
            if (id) { loadVideo(id); embedBtn.textContent = '✓ Loaded'; setTimeout(() => embedBtn.textContent = 'Embed', 1200); }
        };
        ytInput.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); embedBtn.click(); } };
    }

    document.querySelectorAll('.ws-timestamp-card').forEach(c => {
        const h = c.querySelector('.ws-ts-header');
        if (h) h.onclick = () => {
            seekTo(+c.dataset.time);
            if (c.querySelector('.ws-ts-content')) {
                c.classList.toggle('expanded');
                const arr = c.querySelector('.ws-ts-arrow');
                if (arr) arr.textContent = c.classList.contains('expanded') ? '▼' : '▶';
            }
        };
    });

    const tabN = document.getElementById('tabNotesBtn'), tabC = document.getElementById('tabCodeBtn'), vN = document.getElementById('viewNotes'), vC = document.getElementById('viewCode');
    const setTab = n => {
        tabN.classList.toggle('active', n);
        tabC.classList.toggle('active', !n);
        vN.style.display = n ? 'flex' : 'none';
        vC.style.display = n ? 'none' : 'flex';
    };
    if (tabN) tabN.onclick = () => setTab(true);
    if (tabC) tabC.onclick = () => setTab(false);
    const qCode = document.getElementById('quickCodeBtn');
    if (qCode) qCode.onclick = () => setTab(false);

    document.querySelectorAll('[data-format]').forEach(b => b.onclick = e => {
        e.preventDefault();
        const f = b.dataset.format;
        if (f === 'h1' || f === 'h2') document.execCommand('formatBlock', false, `<${f}>`);
        else if (f === 'code') { const s = window.getSelection().toString(); if (s) document.execCommand('insertHTML', false, `<code class="ws-inline-code">${s}</code>`); }
        else if (f === 'codeblock') document.execCommand('formatBlock', false, '<pre>');
        else document.execCommand(f, false, null);
        autoSave();
    });

    const mic = document.getElementById('wsMicBtn');
    let rec = null, isRec = false;
    if (mic && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const S = window.SpeechRecognition || window.webkitSpeechRecognition;
        rec = new S();
        rec.continuous = true;
        rec.onresult = e => {
            let t = '';
            for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
            if (noteBody && t) { noteBody.innerHTML += `<p>🎙️ <em>${t}</em></p>`; autoSave(); }
        };
        rec.onerror = () => { isRec = false; mic.classList.remove('recording'); };
    }
    if (mic) mic.onclick = () => {
        isRec = !isRec;
        mic.classList.toggle('recording', isRec);
        if (rec) { try { isRec ? rec.start() : rec.stop(); } catch (e) {} }
    };

    const noteBody = document.getElementById('wsNoteBody'), autoSt = document.getElementById('wsAutoSaveStatus');
    let sTimer;
    const autoSave = () => {
        if (!autoSt) return;
        autoSt.textContent = 'Saving...'; autoSt.style.color = '#f59e0b';
        clearTimeout(sTimer);
        sTimer = setTimeout(() => { autoSt.textContent = '✓ Auto-saved'; autoSt.style.color = '#10b981'; }, 600);
    };
    if (noteBody) noteBody.oninput = autoSave;

    const addTs = document.getElementById('addTimestampBtn');
    if (addTs && noteBody) addTs.onclick = () => {
        const div = document.createElement('div');
        div.className = 'ws-timestamp-card';
        div.dataset.time = '360';
        div.contentEditable = 'false';
        div.innerHTML = `<div class="ws-ts-header"><span class="ws-ts-icon ws-ts-play">▶</span><span class="ws-ts-label">6. Key Takeaways & Summary</span><span class="ws-ts-time">06:00</span></div>`;
        div.querySelector('.ws-ts-header').onclick = () => seekTo(360);
        noteBody.appendChild(div);
        autoSave();
    };

    const tip = document.getElementById('wsAiTooltip'), genDeck = document.getElementById('wsGeneratedDeck'), miniCard = document.getElementById('wsMiniDeckCard'), qEl = document.getElementById('wsDeckQuestionText'), aEl = document.getElementById('wsDeckAnswerText');
    let selText = '';
    const onSel = e => {
        const s = window.getSelection();
        if (s && s.toString().trim().length > 3 && noteBody && noteBody.contains(s.anchorNode)) {
            selText = s.toString().trim();
            const r = s.getRangeAt(0).getBoundingClientRect();
            tip.style.display = 'block'; tip.style.position = 'fixed';
            tip.style.left = (r.left + r.width / 2) + 'px'; tip.style.top = (r.top - 10) + 'px';
        } else if (tip && (!e || !e.target.closest('#wsAiTooltip'))) tip.style.display = 'none';
    };
    document.addEventListener('mouseup', onSel);
    document.addEventListener('keyup', onSel);

    const makeCard = txt => {
        txt = txt || 'ReLU (Rectified Linear Unit)';
        if (qEl) qEl.textContent = `What is the core concept of "${txt.length > 50 ? txt.slice(0, 48) + '...' : txt}"?`;
        if (aEl) aEl.textContent = `It represents: ${txt}. In neural networks, it simplifies activation to max(0, a) and resolves vanishing gradient bottlenecks.`;
        if (genDeck) { genDeck.style.display = 'block'; genDeck.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        if (miniCard) miniCard.classList.remove('flipped');
        if (tip) tip.style.display = 'none';
    };
    const trigBtn = document.getElementById('wsTriggerFlashcardBtn'), sHigh = document.getElementById('sampleHighlightSpan'), aiNotes = document.getElementById('aiNotesBtn');
    if (trigBtn) trigBtn.onclick = e => { e.stopPropagation(); makeCard(selText); };
    if (sHigh) sHigh.onclick = e => { e.stopPropagation(); makeCard(sHigh.textContent); };
    if (aiNotes) aiNotes.onclick = () => { makeCard('Neural Network Activations: Biases and ReLU thresholding'); aiNotes.textContent = '✓ Generated'; setTimeout(() => aiNotes.textContent = '✨ AI Notes', 1200); };
    if (miniCard) miniCard.onclick = () => miniCard.classList.toggle('flipped');
    const closeDeck = document.getElementById('wsDismissDeckBtn');
    if (closeDeck && genDeck) closeDeck.onclick = () => genDeck.style.display = 'none';

    const ed = document.getElementById('wsCodeEditor'), lines = document.getElementById('wsLineNumbers'), lang = document.getElementById('wsLangSelect'), runBtn = document.getElementById('wsRunCodeBtn'), rstBtn = document.getElementById('wsResetCodeBtn'), term = document.getElementById('wsTerminalOutput'), st = document.getElementById('wsTermStatus');
    const pyCode = `import math\n\ndef relu(x):\n    return max(0.0, x)\n\ndef sigmoid(x):\n    return 1.0 / (1.0 + math.exp(-x))\n\ntest_inputs = [-3.0, -1.0, 0.0, 1.5, 4.0]\nprint("=== Neural Network Activation Results ===")\nfor x in test_inputs:\n    print(f"x = {x:4.1f} | ReLU(x) = {relu(x):.2f} | Sigmoid(x) = {sigmoid(x):.4f}")\n`;
    const jsCode = `function relu(x) {\n    return Math.max(0, x);\n}\nfunction sigmoid(x) {\n    return 1 / (1 + Math.exp(-x));\n}\nconst testInputs = [-3.0, -1.0, 0.0, 1.5, 4.0];\nconsole.log("=== Neural Network Activation Results ===");\ntestInputs.forEach(x => {\n    console.log(\`x = \${x.toFixed(1)} | ReLU(x) = \${relu(x).toFixed(2)} | Sigmoid(x) = \${sigmoid(x).toFixed(4)}\`);\n});\n`;
    const syncLines = () => { if (ed && lines) lines.innerHTML = Array.from({ length: Math.max(ed.value.split('\n').length, 10) }, (_, i) => i + 1).join('<br>'); };
    const setCode = l => { if (ed) { ed.value = l === 'javascript' ? jsCode : pyCode; syncLines(); } };
    if (ed) {
        setCode('python');
        ed.oninput = syncLines;
        ed.onkeydown = e => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const s = ed.selectionStart, eEnd = ed.selectionEnd;
                ed.value = ed.value.substring(0, s) + '    ' + ed.value.substring(eEnd);
                ed.selectionStart = ed.selectionEnd = s + 4;
                syncLines();
            }
        };
    }
    if (lang) lang.onchange = () => { setCode(lang.value); if (term) term.textContent = `Language switched to ${lang.value}. Ready to run.`; };
    if (rstBtn) rstBtn.onclick = () => { setCode(lang ? lang.value : 'python'); if (term) term.textContent = 'Code reset to starter template.'; };
    if (runBtn && ed && term) runBtn.onclick = () => {
        st.textContent = 'Running...'; st.style.color = '#f59e0b';
        const t0 = performance.now();
        setTimeout(() => {
            const out = [];
            try {
                if (lang && lang.value === 'javascript') {
                    new Function('console', ed.value)({ log: (...a) => out.push(a.join(' ')), error: (...a) => out.push('[ERROR] ' + a.join(' ')) });
                } else {
                    out.push('=== Neural Network Activation Results ===');
                    [-3.0, -1.0, 0.0, 1.5, 4.0].forEach(x => {
                        out.push(`x = ${x < 0 ? x.toFixed(1) : ' ' + x.toFixed(1)} | ReLU(x) = ${Math.max(0, x).toFixed(2)} | Sigmoid(x) = ${(1 / (1 + Math.exp(-x))).toFixed(4)}`);
                    });
                }
                const ms = (performance.now() - t0).toFixed(1);
                term.textContent = `${out.join('\n')}\n\n[Finished in ${ms}ms with exit code 0]`;
                st.textContent = `Finished (${ms}ms)`; st.style.color = '#10b981';
            } catch (err) {
                term.textContent = `[Runtime Error]\n${err.message}`;
                st.textContent = 'Error'; st.style.color = '#ef4444';
            }
        }, 150);
    };
}

// Sign In Form Interaction
var signinForm = document.getElementById('signinForm');
if (signinForm) {
    signinForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var submitBtn = signinForm.querySelector('.submit');
        if (submitBtn) {
            submitBtn.textContent = 'SIGNING IN...';
            setTimeout(function () {
                submitBtn.textContent = '✓ SUCCESS';
                setTimeout(function () {
                    window.location.href = 'index.html#features';
                }, 500);
            }, 600);
        }
    });
}
