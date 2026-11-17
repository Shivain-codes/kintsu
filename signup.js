document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

  const themeBtn = document.getElementById('darkToggle');
  const savedTheme = localStorage.getItem('kintsu_theme');
  const startDark = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark', startDark);
  if (themeBtn) {
    themeBtn.onclick = () => {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem('kintsu_theme', isDark ? 'dark' : 'light');
    };
  }
  const showError = (msg, input) => {
    const box = $('signupError');
    if (box) { box.textContent = msg; box.hidden = false; } else alert(msg);
    input?.focus();
  };

  let creating = false;
  $('signupForm')?.addEventListener('submit', e => {
    e.preventDefault();
    if (creating) return;
    const box = $('signupError');
    if (box) { box.textContent = ''; box.hidden = true; }

    const email = $('signupEmail')?.value.trim() || '';
    const password = $('signupPassword')?.value || '';
    const btn = e.target.querySelector('.submit');

    if (!email || !email.includes('@')) return showError('Please enter a valid email address.', $('signupEmail'));
    if (!password || password.length < 4) return showError('Password must be at least 4 characters long.', $('signupPassword'));

    creating = true;
    btn.disabled = true;
    btn.textContent = 'CREATING...';
    fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Could not create the account.');
        set('kintsu_user', JSON.stringify({ email: data.data.email, username: data.data.username }));
        btn.textContent = '\u2713 ACCOUNT CREATED';
        setTimeout(() => (location.href = 'flashcards.html'), 400);
      })
      .catch(err => {
        creating = false;
        btn.disabled = false;
        btn.textContent = 'CREATE ACCOUNT';
        showError(err instanceof TypeError ? 'Could not reach the server.' : err.message, $('signupEmail'));
      });
  });
  // Continue with Google: demo only, NOT real OAuth.
  const googleHolder = $('googleSignIn');
  if (googleHolder) {
    const onGoogleCredential = response => {
      fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: response.credential }) })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (!ok) throw new Error(data.error || 'Google sign-in failed.');
          set('kintsu_user', JSON.stringify({ email: data.data.email, username: data.data.username }));
          location.href = 'flashcards.html';
        })
        .catch(err => showError(err.message));
    };
    fetch('/api/auth/google-client-id').then(res => res.json()).then(cfg => {
      let tries = 0;
      const renderWhenReady = () => {
        if (window.google && google.accounts && cfg.clientId) {
          google.accounts.id.initialize({ client_id: cfg.clientId, callback: onGoogleCredential });
          google.accounts.id.renderButton(googleHolder, { theme: 'outline', size: 'large', text: 'continue_with', width: 320 });
        } else if (tries++ < 50) {
          setTimeout(renderWhenReady, 100);
        }
      };
      renderWhenReady();
    }).catch(() => {});
  }
  const membersList = $('membersList');
  const membersStatus = $('membersStatus');
  if (membersList) {
    fetch('/api/external/users')
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Request failed');
        data.data.slice(0, 5).forEach(person => {
          const item = document.createElement('li');
          const name = document.createElement('span');
          name.className = 'member-name';
          name.textContent = person.name;
          const meta = document.createElement('span');
          meta.className = 'member-meta';
          meta.textContent = person.email + ' | ' + person.company.name;
          item.append(name, meta);
          membersList.appendChild(item);
        });
        membersStatus.hidden = true;
      })
      .catch(() => { membersStatus.textContent = 'Could not load members right now.'; });
  }
});
