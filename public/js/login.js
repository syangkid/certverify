const form = document.getElementById('login-form');
const message = document.getElementById('message');

function showError(text) {
  message.textContent = text;
  message.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();   // stop the normal form submission
  message.hidden = true;

  const button = form.querySelector('button');
  button.disabled = true;
  button.textContent = 'Signing in...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email.value,
        password: form.password.value,
      }),
    });
    const data = await response.json();

    if (response.ok) {
      window.location.href = '/dashboard'; // success: go to the role dashboard
      return;
    }
    showError(data.message || 'Login failed.');
  } catch (err) {
    showError('Could not reach the server. Please try again.');
  }

  button.disabled = false;
  button.textContent = 'Sign in';
});
