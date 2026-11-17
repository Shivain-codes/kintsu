// Kintsu signup page: same behaviour as the original — validate, save to
// localStorage, POST to /api/users — then list the saved users and the external users.
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  const showError = msg => {
    const box = $('signupError');
    box.textContent = msg;
    box.hidden = false;
  };

  async function loadUsers() {
    const res = await fetch('/api/users');
    const users = await res.json();
    $('userList').innerHTML = users.map(u => `<li>${u.username} — ${u.email}</li>`).join('');
  }

  // Fetched through our own server route, not directly: the page still works
  // when the browser blocks cross-origin calls, and the server can shape the data.
  // Direct alternative: fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json())
  async function loadExternalUsers() {
    try {
      const res = await fetch('/api/external/users');
      if (!res.ok) throw new Error('External API failed');
      const users = await res.json();
      $('externalList').innerHTML = users.map(u => `<li>${u.name} — ${u.email}</li>`).join('');
    } catch {
      $('externalList').innerHTML = '<li>Could not load external users.</li>';
    }
  }

  $('signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const box = $('signupError');
    box.textContent = '';
    box.hidden = true;

    const email = $('signupEmail').value.trim();
    const password = $('signupPassword').value;

    if (!email || !email.includes('@')) return showError('Please enter a valid email address.');
    if (!password || password.length < 4) return showError('Password must be at least 4 characters long.');

    const user = { email, username: email.split('@')[0] };
    try { localStorage.setItem('kintsu_user', JSON.stringify(user)); } catch {}
    const btn = e.target.querySelector('.submit');
    btn.disabled = true;
    btn.textContent = 'CREATING...';
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch {}
    btn.textContent = '✓ ACCOUNT CREATED';
    $('okMsg').textContent = 'Account created for ' + user.username + '.';
    $('okMsg').hidden = false;
    loadUsers();
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Create Account'; }, 1500);
  });

  loadUsers();
  loadExternalUsers();
});
