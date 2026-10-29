document.addEventListener('DOMContentLoaded', function () {
    var toastBox = document.getElementById('toastNotification'), toastTimeout;
    function showToast(message, duration) {
        if (!toastBox) return;
        duration = duration || 3000;
        clearTimeout(toastTimeout);
        toastBox.textContent = message;
        toastBox.classList.add('show');
        toastTimeout = setTimeout(function () { toastBox.classList.remove('show'); }, duration);
    }
    function safeGetStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) { return null; }
    }
    function safeSetStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {}
    }
    var darkToggle = document.getElementById('darkToggle'), savedTheme = safeGetStorage('kintsu_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
        document.documentElement.classList.add('dark');
    }
    if (darkToggle) {
        darkToggle.addEventListener('click', function () {
            document.body.classList.toggle('dark');
            document.documentElement.classList.toggle('dark');
            var isDark = document.body.classList.contains('dark');
            safeSetStorage('kintsu_theme', isDark ? 'dark' : 'light');
            showToast(isDark ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️', 1800);
        });
    }
    var selectableText = document.getElementById('selectableText'), selectionPopup = document.getElementById('selectionPopup'), btnCreateFlashcard = document.getElementById('btnCreateFlashcard'), btnDismissFlashcard = document.getElementById('btnDismissFlashcard'), synthesisBanner = document.getElementById('synthesisBanner'), flashcardDeck = document.getElementById('flashcardDeck'), FULL_DEMO_TEXT = "Modern LLMs rely on Transformer self-attention to process entire sequences in parallel. Unlike sequential RNNs, Multi-Head Attention allows tokens to dynamically attend to contextual relationships across distant words. Scaled Dot-Product Attention computes query-key affinity scores normalized by the square root of the head dimension.", DEFAULT_HIGHLIGHT = "Scaled Dot-Product Attention computes query-key affinity scores normalized by the square root of the head dimension.", isUserInteracted = false, autoDemoTimer = null, autoStepTimeout = null;
    function renderDemoText(highlightPhrase) {
        if (!selectableText) return;
        selectableText.innerHTML = '';
        if (!highlightPhrase || !FULL_DEMO_TEXT.includes(highlightPhrase)) {
            selectableText.textContent = FULL_DEMO_TEXT;
            return;
        }
        var idx = FULL_DEMO_TEXT.indexOf(highlightPhrase), beforeText = FULL_DEMO_TEXT.substring(0, idx), afterText = FULL_DEMO_TEXT.substring(idx + highlightPhrase.length);
        if (beforeText) { selectableText.appendChild(document.createTextNode(beforeText)); }
        var mark = document.createElement('mark');
        mark.className = 'demo-highlight-mark';
        mark.id = 'interactiveMark';
        mark.textContent = highlightPhrase;
        mark.title = 'Click to show flashcard prompt';
        mark.addEventListener('click', function (e) {
            e.stopPropagation();
            if (selectionPopup) { selectionPopup.classList.toggle('show'); }
        });
        selectableText.appendChild(mark);
        if (afterText) { selectableText.appendChild(document.createTextNode(afterText)); }
    }
    renderDemoText(DEFAULT_HIGHLIGHT);
    if (selectionPopup) { selectionPopup.classList.add('show'); }
    function handleDemoSelection() {
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        var selectedStr = sel.toString().trim(), normalized = selectedStr.replace(/\s+/g, ' ');
        if (normalized.length >= 6) {
            var matchIdx = FULL_DEMO_TEXT.indexOf(normalized);
            if (matchIdx !== -1) {
                isUserInteracted = true;
                clearTimeout(autoStepTimeout);
                clearInterval(autoDemoTimer);
                renderDemoText(normalized);
                if (selectionPopup) { selectionPopup.classList.add('show'); }
                sel.removeAllRanges();
            }
        }
    }
    if (selectableText) {
        selectableText.addEventListener('mouseup', handleDemoSelection);
        selectableText.addEventListener('touchend', handleDemoSelection);
    }
    if (btnDismissFlashcard) {
        btnDismissFlashcard.addEventListener('click', function (e) {
            e.stopPropagation();
            isUserInteracted = true;
            clearTimeout(autoStepTimeout);
            clearInterval(autoDemoTimer);
            if (selectionPopup) selectionPopup.classList.remove('show');
            renderDemoText(null);
            showToast('Highlight dismissed', 1500);
        });
    }
    if (btnCreateFlashcard) {
        btnCreateFlashcard.addEventListener('click', function (e) {
            e.stopPropagation();
            isUserInteracted = true;
            clearTimeout(autoStepTimeout);
            clearInterval(autoDemoTimer);
            if (selectionPopup) selectionPopup.classList.remove('show');
            if (synthesisBanner) synthesisBanner.classList.add('active');
            showToast('Running AI recall synthesis…', 2000);
            setTimeout(function () {
                if (synthesisBanner) synthesisBanner.classList.remove('active');
                cycleCardDeck();
                showToast('✨ 3 Flashcards generated from lecture notes!', 3500);
            }, 1200);
        });
    }
    function runAutoDemoCycle() {
        if (isUserInteracted) return;
        renderDemoText(null);
        if (selectionPopup) selectionPopup.classList.remove('show');
        autoStepTimeout = setTimeout(function () {
            if (isUserInteracted) return;
            renderDemoText(DEFAULT_HIGHLIGHT);
            if (selectionPopup) selectionPopup.classList.remove('show');
            autoStepTimeout = setTimeout(function () {
                if (isUserInteracted) return;
                if (selectionPopup) selectionPopup.classList.remove('show');
                if (synthesisBanner) synthesisBanner.classList.add('active');
                autoStepTimeout = setTimeout(function () {
                    if (isUserInteracted) return;
                    if (synthesisBanner) synthesisBanner.classList.remove('active');
                    cycleCardDeck();
                }, 1400);
            }, 2000);
        }, 1200);
    }
    autoDemoTimer = setInterval(function () {
        if (!isUserInteracted) { runAutoDemoCycle(); }
    }, 14000);
    var cards = Array.from(document.querySelectorAll('.flashcard-item')), cardPositions = ['card-pos-1', 'card-pos-2', 'card-pos-3'];
    function cycleCardDeck() {
        if (!cards.length) return;
        cards.forEach(function (c) { c.classList.remove('flipped'); });
        var top = cards.shift();
        cards.push(top);
        cards.forEach(function (card, i) { card.className = 'flashcard-item ' + cardPositions[i]; });
    }
    cards.forEach(function (card) {
        card.addEventListener('click', function () {
            if (card.classList.contains('card-pos-1')) {
                if (card.classList.contains('flipped')) {
                    cycleCardDeck();
                } else { card.classList.add('flipped'); }
            } else {
                var maxAttempts = cards.length;
                while (!card.classList.contains('card-pos-1') && maxAttempts > 0) {
                    cycleCardDeck();
                    maxAttempts--;
                }
            }
        });
        card.addEventListener('keydown', function (e) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                card.click();
            }
        });
    });
    var ytUrlInput = document.getElementById('ytUrlInput'), btnEmbedVideo = document.getElementById('btnEmbedVideo'), ytVideoPlayer = document.getElementById('ytVideoPlayer');
    function extractYouTubeId(url) {
        if (!url) return null;
        var trimmed = url.trim();
        if (/^[\w-]{11}$/.test(trimmed)) { return trimmed; }
        var match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+?&v=|shorts\/|live\/))([\w-]{11})/);
        return match ? match[1] : null;
    }
    if (btnEmbedVideo && ytUrlInput && ytVideoPlayer) {
        btnEmbedVideo.addEventListener('click', function () {
            var url = ytUrlInput.value.trim();
            if (!url) {
                ytUrlInput.setAttribute('aria-invalid', 'true');
                showToast('Please enter a YouTube video URL ⚠️');
                ytUrlInput.focus();
                return;
            }
            var videoId = extractYouTubeId(url);
            if (videoId) {
                ytUrlInput.removeAttribute('aria-invalid');
                ytVideoPlayer.src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?enablejsapi=1&rel=0&modestbranding=1';
                showToast('Lecture video embedded successfully! 🎥');
            } else {
                ytUrlInput.setAttribute('aria-invalid', 'true');
                showToast('Invalid or unsupported YouTube URL ⚠️');
                ytUrlInput.focus();
            }
        });
        ytUrlInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnEmbedVideo.click();
            }
        });
    }
    var editorCanvas = document.getElementById('editorCanvas'), btnAddTimestamp = document.getElementById('btnAddTimestamp'), btnAiNotes = document.getElementById('btnAiNotes'), videoTimeReadout = document.getElementById('videoTimeReadout');
    try {
        var activeNoteRaw = safeGetStorage('kintsu_active_note');
        if (activeNoteRaw) {
            var activeNote = JSON.parse(activeNoteRaw);
            if (activeNote && typeof activeNote === 'object') {
                if (activeNote.videoUrl && typeof activeNote.videoUrl === 'string' && ytVideoPlayer) {
                    var handoffVideoId = extractYouTubeId(activeNote.videoUrl);
                    if (handoffVideoId) {
                        ytVideoPlayer.src = 'https://www.youtube.com/embed/' + encodeURIComponent(handoffVideoId) + '?enablejsapi=1&rel=0&modestbranding=1';
                        if (ytUrlInput) ytUrlInput.value = activeNote.videoUrl;
                    }
                }
                if (activeNote.title && typeof activeNote.title === 'string' && editorCanvas) {
                    var noteTitleH1 = editorCanvas.querySelector('h1');
                    if (noteTitleH1) { noteTitleH1.textContent = activeNote.title; }
                }
                if (activeNote.summary && typeof activeNote.summary === 'string' && editorCanvas) {
                    var noteIntroP = editorCanvas.querySelector('p');
                    if (noteIntroP) { noteIntroP.textContent = activeNote.summary; }
                }
            }
        }
    } catch (e) {}
    var currentLectureSeconds = 213;
    function formatTime(secs) {
        var m = Math.floor(secs / 60), s = secs % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }
    if (btnAddTimestamp && editorCanvas) {
        btnAddTimestamp.addEventListener('click', function () {
            var timeStr = formatTime(currentLectureSeconds), timestampSpan = document.createElement('span');
            timestampSpan.className = 'timestamp-link';
            timestampSpan.setAttribute('data-timestamp', currentLectureSeconds);
            timestampSpan.setAttribute('role', 'button');
            timestampSpan.title = 'Jump video to ' + timeStr;
            timestampSpan.textContent = '[' + timeStr + ']';
            editorCanvas.focus();
            var sel = window.getSelection();
            if (sel && sel.rangeCount > 0 && editorCanvas.contains(sel.anchorNode)) {
                var range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(timestampSpan);
                range.collapse(false);
            } else { editorCanvas.appendChild(timestampSpan); }
            showToast('Timestamp [' + timeStr + '] added to notes!');
        });
    }
    if (btnAiNotes && editorCanvas) {
        btnAiNotes.addEventListener('click', function () {
            var btnText = document.getElementById('aiNotesBtnText');
            if (btnText) btnText.textContent = 'Generating…';
            showToast('Synthesizing notes preview from lecture transcript…');
            setTimeout(function () {
                if (btnText) btnText.textContent = 'AI Notes';
                var summarySection = document.createElement('div');
                summarySection.className = 'toggle-topic toggle-topic-open';
                summarySection.innerHTML =
                    '<div class="toggle-topic-header" contenteditable="false">' +
                        '<button type="button" class="toggle-topic-trigger" aria-label="Toggle topic">' +
                            '<span class="toggle-topic-caret"></span>' +
                        '</button>' +
                        '<input class="toggle-topic-title" type="text" value="AI Synthesis: Key Takeaways (' + formatTime(currentLectureSeconds) + ')">' +
                    '</div>' +
                    '<div class="toggle-topic-content">' +
                        '<p>✨ <strong>Automated Lecture Synthesis (Preview):</strong></p>' +
                        '<ul>' +
                            '<li>Deep representations learn hierarchical feature detectors automatically through gradient descent.</li>' +
                            '<li>Matrix operations leverage parallel SIMD and GPU tensors for high-throughput batching.</li>' +
                        '</ul>' +
                    '</div>';
                editorCanvas.prepend(summarySection);
                showToast('✨ AI Summary added to your notes!');
            }, 1000);
        });
    }
    document.addEventListener('click', function (e) {
        var link = e.target.closest('.timestamp-link');
        if (link) {
            var secs = parseInt(link.getAttribute('data-timestamp'), 10) || 0;
            currentLectureSeconds = secs;
            if (videoTimeReadout) { videoTimeReadout.textContent = formatTime(secs); }
            if (ytVideoPlayer && ytVideoPlayer.contentWindow) {
                try {
                    ytVideoPlayer.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'seekTo',
                        args: [secs, true]
                    }), '*');
                } catch (err) {}
            }
            showToast('Seeking video to ' + formatTime(secs) + ' ⏩');
        }
    });
    function setupFormatCommand(btnId, command, value) {
        var btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (editorCanvas) {
                editorCanvas.focus();
                document.execCommand(command, false, value || null);
            }
        });
    }
    setupFormatCommand('cmdBold', 'bold');
    setupFormatCommand('cmdItalic', 'italic');
    setupFormatCommand('cmdUnderline', 'underline');
    setupFormatCommand('cmdStrike', 'strikeThrough');
    setupFormatCommand('cmdH1', 'formatBlock', 'H1');
    setupFormatCommand('cmdH2', 'formatBlock', 'H2');
    setupFormatCommand('cmdBullet', 'insertUnorderedList');
    setupFormatCommand('cmdOrdered', 'insertOrderedList');
    setupFormatCommand('cmdQuote', 'formatBlock', 'BLOCKQUOTE');
    setupFormatCommand('cmdHr', 'insertHorizontalRule');
    setupFormatCommand('cmdUndo', 'undo');
    setupFormatCommand('cmdRedo', 'redo');
    setupFormatCommand('cmdHighlight', 'hiliteColor', 'rgba(236, 50, 159, 0.85)');
    var workspaceSelectionBubble = document.getElementById('workspaceSelectionBubble'), bubbleBtnYes = document.getElementById('bubbleBtnYes'), bubbleBtnNo = document.getElementById('bubbleBtnNo'), pendingSelectionRange = null;
    function hideWorkspaceBubble() {
        if (workspaceSelectionBubble) {
            workspaceSelectionBubble.classList.remove('show');
            workspaceSelectionBubble.style.display = 'none';
        }
        pendingSelectionRange = null;
    }
    function showWorkspaceBubble(rect) {
        if (!workspaceSelectionBubble) return;
        var top = rect.top - 46, left = rect.left + rect.width / 2;
        if (top < 10) top = rect.bottom + 10;
        if (left < 90) left = 90;
        if (left > window.innerWidth - 90) left = window.innerWidth - 90;
        workspaceSelectionBubble.style.top = top + 'px';
        workspaceSelectionBubble.style.left = left + 'px';
        workspaceSelectionBubble.style.display = 'flex';
        workspaceSelectionBubble.classList.add('show');
    }
    document.addEventListener('mouseup', function (e) {
        if (e.target && e.target.closest && e.target.closest('.workspace-selection-bubble')) { return; }
        setTimeout(function () {
            var sel = window.getSelection();
            if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
                hideWorkspaceBubble();
                return;
            }
            if (!editorCanvas || !editorCanvas.contains(sel.anchorNode)) {
                hideWorkspaceBubble();
                return;
            }
            var text = sel.toString().trim();
            if (text.length < 5 || text.split(/\s+/).length > 250) {
                hideWorkspaceBubble();
                return;
            }
            var range = sel.getRangeAt(0);
            pendingSelectionRange = range.cloneRange();
            var rect = range.getBoundingClientRect();
            showWorkspaceBubble(rect);
        }, 10);
    });
    if (bubbleBtnYes) {
        bubbleBtnYes.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (pendingSelectionRange) {
                try {
                    var mark = document.createElement('mark');
                    mark.className = 'notes-highlight-mark';
                    mark.title = 'AI Flashcard source';
                    mark.appendChild(pendingSelectionRange.extractContents());
                    pendingSelectionRange.insertNode(mark);
                } catch (err) { document.execCommand('hiliteColor', false, 'rgba(236, 50, 159, 0.85)'); }
            }
            hideWorkspaceBubble();
            showToast('✨ 3 AI Flashcards generated from note highlight!', 3500);
            cycleCardDeck();
        });
    }
    if (bubbleBtnNo) {
        bubbleBtnNo.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            hideWorkspaceBubble();
        });
    }
    window.addEventListener('scroll', hideWorkspaceBubble, { passive: true });
    window.addEventListener('resize', hideWorkspaceBubble, { passive: true });
    var cmdVoice = document.getElementById('cmdVoice');
    if (cmdVoice) {
        cmdVoice.addEventListener('click', function () { showToast('🎙️ Voice-to-text listening… (Dictation simulation)'); });
    }
    var btnInsertCodeBlock = document.getElementById('btnInsertCodeBlock');
    if (btnInsertCodeBlock && editorCanvas) {
        btnInsertCodeBlock.addEventListener('click', function () {
            var pre = document.createElement('pre');
            pre.style.cssText = 'background:#0e0a15; color:#7ad1f5; border:2px solid var(--ink); border-radius:8px; padding:12px; margin:12px 0; font-family:var(--font-mono);';
            pre.textContent = 'function calculateActivation(z) {\n  return 1 / (1 + Math.exp(-z));\n}';
            editorCanvas.appendChild(pre);
            showToast('Code block inserted into notes 💻');
        });
    }
    document.addEventListener('click', function (e) {
        var trigger = e.target.closest('.toggle-topic-trigger');
        if (trigger) {
            var topic = trigger.closest('.toggle-topic');
            if (topic) { topic.classList.toggle('closed'); }
        }
    });
    var tabNotesBtn = document.getElementById('tabNotesBtn'), tabCodeBtn = document.getElementById('tabCodeBtn'), notesView = document.getElementById('notesView'), codeView = document.getElementById('codeView');
    if (tabNotesBtn && tabCodeBtn && notesView && codeView) {
        tabNotesBtn.addEventListener('click', function () {
            tabNotesBtn.classList.add('tab-btn-active');
            tabCodeBtn.classList.remove('tab-btn-active');
            notesView.style.display = 'block';
            codeView.style.display = 'none';
        });
        tabCodeBtn.addEventListener('click', function () {
            tabCodeBtn.classList.add('tab-btn-active');
            tabNotesBtn.classList.remove('tab-btn-active');
            notesView.style.display = 'none';
            codeView.style.display = 'block';
        });
    }
    var btnRunEmbeddedCode = document.getElementById('btnRunEmbeddedCode'), embeddedCodeInput = document.getElementById('embeddedCodeInput'), embeddedTerminalOutput = document.getElementById('embeddedTerminalOutput'), embeddedLangSelect = document.getElementById('embeddedLangSelect'), syntaxBadge = document.getElementById('syntaxBadge');
    if (embeddedLangSelect && syntaxBadge) {
        embeddedLangSelect.addEventListener('change', function () { syntaxBadge.textContent = 'Syntax: ' + embeddedLangSelect.value; });
    }
    var isRunningEmbedded = false;
    if (btnRunEmbeddedCode && embeddedTerminalOutput) {
        btnRunEmbeddedCode.addEventListener('click', function () {
            if (isRunningEmbedded) return;
            var code = embeddedCodeInput ? embeddedCodeInput.value.trim() : '';
            if (!code) {
                embeddedTerminalOutput.textContent = '[Simulation Diagnostic]\nError: Sandbox input is empty. Write code to execute.';
                showToast('Sandbox code editor is empty ⚠️');
                return;
            }
            isRunningEmbedded = true;
            btnRunEmbeddedCode.disabled = true;
            btnRunEmbeddedCode.setAttribute('aria-busy', 'true');
            embeddedTerminalOutput.textContent = '[Sandbox Simulation Environment]\nCompiling and running runtime environment...\n';
            showToast('Executing code sandbox simulation…');
            setTimeout(function () {
                var timestamp = new Date().toLocaleTimeString();
                embeddedTerminalOutput.textContent =
                    '[Sandbox Simulation Output • ' + timestamp + ']\n' +
                    '> Runtime: ' + (embeddedLangSelect ? embeddedLangSelect.value : 'python') + ' (Simulated Environment)\n' +
                    '> Status: 200 OK (0.04s)\n' +
                    '-------------------------------------------\n' +
                    'Computed Neuron Activation: 0.7330\n' +
                    'Weights dot product: 0.9100\n' +
                    'Bias offset applied: +0.1000\n' +
                    'Neuron Classification State: TRIGGERED (1)\n' +
                    '-------------------------------------------\n' +
                    '[Process completed with exit code 0]';
                showToast('Simulation execution completed! ✅');
                isRunningEmbedded = false;
                btnRunEmbeddedCode.disabled = false;
                btnRunEmbeddedCode.removeAttribute('aria-busy');
            }, 600);
        });
    }
    var isRunningFullCode = false;
    var btnRunFullCode = document.getElementById('btnRunFullCode');
    var fullCodeTerminalOutput = document.getElementById('fullCodeTerminalOutput');
    var fullCodeInput = document.getElementById('fullCodeInput');
    var fullCodeLangSelect = document.getElementById('fullCodeLangSelect');
    if (btnRunFullCode && fullCodeTerminalOutput) {
        btnRunFullCode.addEventListener('click', function () {
            if (isRunningFullCode) return;
            var code = fullCodeInput ? fullCodeInput.value.trim() : '';
            if (!code) {
                fullCodeTerminalOutput.textContent = '[Simulation Diagnostic]\nError: Code editor is empty. Enter code to execute.';
                showToast('Code workspace is empty ⚠️');
                return;
            }
            isRunningFullCode = true;
            btnRunFullCode.disabled = true;
            btnRunFullCode.setAttribute('aria-busy', 'true');
            fullCodeTerminalOutput.textContent = '[Sandbox Simulation Environment]\nCompiling in simulated sandbox container...\n';
            showToast('Executing code workspace simulation…');
            setTimeout(function () {
                var timestamp = new Date().toLocaleTimeString();
                fullCodeTerminalOutput.textContent =
                    '[Simulation Run Result • ' + timestamp + ']\n' +
                    '> Runtime: ' + (fullCodeLangSelect ? fullCodeLangSelect.value : 'python') + ' (Isolated Sandbox Container)\n' +
                    '-------------------------------------------\n' +
                    'Original: [3, 1, 4, 1, 5, 9]\n' +
                    'Prefix sums: [3, 4, 8, 9, 14, 23]\n' +
                    '-------------------------------------------\n' +
                    '[Completed in 0.038s with exit code 0]';
                showToast('Ran code simulation successfully! ✅');
                isRunningFullCode = false;
                btnRunFullCode.disabled = false;
                btnRunFullCode.removeAttribute('aria-busy');
            }, 500);
        });
    }
    var workspaceShell = document.getElementById('workspaceShell'), workspaceLeft = document.getElementById('workspaceLeft'), btnModeGuide = document.getElementById('btnModeGuide'), btnModeSplit = document.getElementById('btnModeSplit'), btnModeNotes = document.getElementById('btnModeNotes');
    function setMode(mode) {
        [btnModeGuide, btnModeSplit, btnModeNotes].forEach(function (b) { if (b) b.classList.remove('workspace-mode-button-active'); });
        if (workspaceShell) {
            workspaceShell.classList.remove('mode-guide', 'mode-split', 'mode-notes');
            workspaceShell.classList.add('mode-' + mode);
        }
        if (mode === 'guide' && btnModeGuide) {
            btnModeGuide.classList.add('workspace-mode-button-active');
            if (workspaceShell) workspaceShell.style.setProperty('--left-panel-width', '70%');
        } else if (mode === 'notes' && btnModeNotes) {
            btnModeNotes.classList.add('workspace-mode-button-active');
            if (workspaceShell) workspaceShell.style.setProperty('--left-panel-width', '0%');
        } else if (btnModeSplit) {
            btnModeSplit.classList.add('workspace-mode-button-active');
            if (workspaceShell) workspaceShell.style.setProperty('--left-panel-width', '50%');
        }
    }
    if (btnModeGuide) btnModeGuide.addEventListener('click', function () { setMode('guide'); });
    if (btnModeSplit) btnModeSplit.addEventListener('click', function () { setMode('split'); });
    if (btnModeNotes) btnModeNotes.addEventListener('click', function () { setMode('notes'); });
    var workspaceResizer = document.getElementById('workspaceResizer'), isDragging = false;

    function applyResizerWidth(clientX) {
        if (!workspaceShell || window.innerWidth <= 960) return;
        var shellRect = workspaceShell.getBoundingClientRect();
        if (shellRect.width <= 0) return;
        var offset = clientX - shellRect.left, percentage = Math.max(25, Math.min(75, (offset / shellRect.width) * 100));
        if (isNaN(percentage)) return;
        workspaceShell.style.setProperty('--left-panel-width', percentage + '%');
        if (workspaceResizer) { workspaceResizer.setAttribute('aria-valuenow', Math.round(percentage)); }
    }

    function stopDragging() {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }

    if (workspaceResizer && workspaceShell) {
        workspaceResizer.addEventListener('mousedown', function (e) {
            isDragging = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        window.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            applyResizerWidth(e.clientX);
        });

        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('blur', stopDragging);

        workspaceResizer.addEventListener('touchstart', function () {
            isDragging = true;
        }, { passive: true });

        window.addEventListener('touchmove', function (e) {
            if (!isDragging || !e.touches || !e.touches[0]) return;
            applyResizerWidth(e.touches[0].clientX);
        }, { passive: true });

        window.addEventListener('touchend', stopDragging);
        window.addEventListener('touchcancel', stopDragging);

        workspaceResizer.addEventListener('keydown', function (e) {
            var currentVal = parseFloat(workspaceShell.style.getPropertyValue('--left-panel-width')) || 50;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                var newVal = Math.max(25, currentVal - 5);
                workspaceShell.style.setProperty('--left-panel-width', newVal + '%');
                workspaceResizer.setAttribute('aria-valuenow', Math.round(newVal));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                var newVal = Math.min(75, currentVal + 5);
                workspaceShell.style.setProperty('--left-panel-width', newVal + '%');
                workspaceResizer.setAttribute('aria-valuenow', Math.round(newVal));
            } else if (e.key === 'Home') {
                e.preventDefault();
                workspaceShell.style.setProperty('--left-panel-width', '25%');
                workspaceResizer.setAttribute('aria-valuenow', 25);
            } else if (e.key === 'End') {
                e.preventDefault();
                workspaceShell.style.setProperty('--left-panel-width', '75%');
                workspaceResizer.setAttribute('aria-valuenow', 75);
            }
        });
    }

    var feedbackForm = document.getElementById('feedbackForm'), ratingRange = document.getElementById('ratingRange'), ratingVal = document.getElementById('ratingVal'), catPills = document.querySelectorAll('.cat-pill'), feedbackText = document.getElementById('feedbackText'), feedbackFormStatus = document.getElementById('feedbackFormStatus'), btnSendFeedback = document.getElementById('btnSendFeedback'), isSubmittingFeedback = false;

    if (ratingRange && ratingVal) {
        var updateRatingDisplay = function () {
            ratingVal.textContent = ratingRange.value;
            ratingRange.setAttribute('aria-valuenow', ratingRange.value);
        };
        ratingRange.addEventListener('input', updateRatingDisplay);
        ratingRange.addEventListener('change', updateRatingDisplay);
    }

    function selectCatPill(targetPill) {
        catPills.forEach(function (p) {
            p.classList.remove('cat-pill-active');
            p.setAttribute('aria-checked', 'false');
        });
        targetPill.classList.add('cat-pill-active');
        targetPill.setAttribute('aria-checked', 'true');
    }

    catPills.forEach(function (pill, index) {
        pill.addEventListener('click', function () { selectCatPill(pill); });
        pill.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                var next = catPills[(index + 1) % catPills.length];
                next.focus();
                selectCatPill(next);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                var prev = catPills[(index - 1 + catPills.length) % catPills.length];
                prev.focus();
                selectCatPill(prev);
            }
        });
    });

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (isSubmittingFeedback) return;

            var message = feedbackText ? feedbackText.value.trim() : '';
            if (!message) {
                if (feedbackFormStatus) {
                    feedbackFormStatus.textContent = 'Please enter your message before sending.';
                    feedbackFormStatus.className = 'feedback-status-msg feedback-status-error';
                }
                showToast('Please type a message before submitting ✍️');
                if (feedbackText) feedbackText.focus();
                return;
            }

            var activePill = document.querySelector('.cat-pill.cat-pill-active'), category = activePill ? (activePill.getAttribute('data-cat') || activePill.textContent.trim()) : 'Idea', rating = ratingRange ? ratingRange.value : '4';

            isSubmittingFeedback = true;
            if (btnSendFeedback) {
                btnSendFeedback.disabled = true;
                btnSendFeedback.setAttribute('aria-busy', 'true');
                var btnSpan = btnSendFeedback.querySelector('span');
                if (btnSpan) btnSpan.textContent = 'Sending…';
            }

            if (feedbackFormStatus) {
                feedbackFormStatus.textContent = 'Sending feedback anonymously…';
                feedbackFormStatus.className = 'feedback-status-msg';
            }

            setTimeout(function () {
                showToast('Feedback noted (' + category + ' • ' + rating + '★)! Thank you 🙌', 4000);
                if (feedbackFormStatus) {
                    feedbackFormStatus.textContent = 'Thank you! Your feedback has been received anonymously for this demo session.';
                    feedbackFormStatus.className = 'feedback-status-msg feedback-status-success';
                }
                feedbackForm.reset();
                if (ratingVal) ratingVal.textContent = '4';
                if (ratingRange) {
                    ratingRange.value = '4';
                    ratingRange.setAttribute('aria-valuenow', '4');
                }
                var defaultPill = document.querySelector('.cat-pill[data-cat="Idea"]') || catPills[0];
                if (defaultPill) selectCatPill(defaultPill);

                setTimeout(function () {
                    isSubmittingFeedback = false;
                    if (btnSendFeedback) {
                        btnSendFeedback.disabled = false;
                        btnSendFeedback.removeAttribute('aria-busy');
                        var btnSpan = btnSendFeedback.querySelector('span');
                        if (btnSpan) btnSpan.textContent = 'Send feedback';
                    }
                }, 1200);
            }, 500);
        });
    }

    var signinForm = document.getElementById('signinForm'), isSigningIn = false;
    if (signinForm) {
        signinForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (isSigningIn) return;

            var emailInput = signinForm.querySelector('input[type="email"]'), passwordInput = signinForm.querySelector('input[type="password"]'), submitBtn = signinForm.querySelector('.submit');

            var email = emailInput ? emailInput.value.trim() : '', password = passwordInput ? passwordInput.value : '';

            if (!email || !email.includes('@')) {
                alert('Please enter a valid email address.');
                if (emailInput) emailInput.focus();
                return;
            }

            if (!password || password.length < 4) {
                alert('Password must be at least 4 characters long.');
                if (passwordInput) passwordInput.focus();
                return;
            }

            var username = email.split('@')[0], userRecord = { email: email, username: username };

            safeSetStorage('kintsu_user', JSON.stringify(userRecord));

            if (window.fetch) {
                fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userRecord)
                }).catch(function () {});
            }

            if (submitBtn) {
                isSigningIn = true;
                submitBtn.disabled = true;
                submitBtn.textContent = 'SIGNING IN...';
                setTimeout(function () {
                    submitBtn.textContent = '✓ SUCCESS';
                    setTimeout(function () { window.location.href = 'dashboard.html'; }, 400);
                }, 500);
            }
        });
    }

    var googleBtn = document.getElementById('googleBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', function () {
            var demoUser = { email: 'student@kintsu.edu', username: 'student' };
            safeSetStorage('kintsu_user', JSON.stringify(demoUser));
            googleBtn.textContent = 'CONNECTING...';
            setTimeout(function () {
                window.location.href = 'dashboard.html';
            }, 300);
        });
    }
});
