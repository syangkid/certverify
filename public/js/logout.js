// public/js/logout.js
// Makes the Logout button in the header call the logout API, then go to the login page.

const logoutButton = document.getElementById('logout-button');

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  });
}
