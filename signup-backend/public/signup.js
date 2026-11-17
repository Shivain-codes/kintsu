// Kintsu signup page (2nd evaluation) wired to the Express demo (3rd evaluation):
// same validation, localStorage save and POST /api/users. No dashboard in this demo:
// after creating an account the button resets instead of redirecting.
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

  // Theme: apply saved theme (or system dark), toggle saves it back.
  const theme = get('kintsu_theme');
  if (theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark');
    document.documentElement.classList.add('dark');
  }
  $('darkToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    document.documentElement.classList.toggle('dark');
    set('kintsu_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  const showError = (msg, input) => {
    const box = $('signupError');
    if (box) { box.textContent = msg; box.hidden = false; } else alert(msg);
    input?.focus();
  };

  // Create account form.
  let creating = false;
  $('signupForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (creating) return;
    const box = $('signupError');
    if (box) { box.textContent = ''; box.hidden = true; }

    const email = $('signupEmail')?.value.trim() || '';
    const password = $('signupPassword')?.value || '';
    const btn = e.target.querySelector('.submit');

    if (!email || !email.includes('@')) return showError('Please enter a valid email address.', $('signupEmail'));
    if (!password || password.length < 4) return showError('Password must be at least 4 characters long.', $('signupPassword'));

    const user = { email, username: email.split('@')[0] };
    set('kintsu_user', JSON.stringify(user));

    creating = true;
    if (btn) { btn.disabled = true; btn.textContent = 'CREATING...'; }
    try {
      await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    } catch {}
    if (btn) btn.textContent = '✓ ACCOUNT CREATED';
    setTimeout(() => {
      creating = false;
      if (btn) { btn.disabled = false; btn.textContent = 'CREATE ACCOUNT'; }
    }, 1500);
  });

  // Continue with Google: demo only, NOT real OAuth.
  $('googleBtn')?.addEventListener('click', () => {
    set('kintsu_user', JSON.stringify({ email: 'student@kintsu.edu', username: 'student' }));
    $('googleBtn').textContent = 'CONNECTING...';
    setTimeout(() => { $('googleBtn').textContent = 'Continue with Google'; }, 300);
  });
});
