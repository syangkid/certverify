// public/js/certificates.js
// Runs in the browser on the Certificates page: issue a certificate and revoke one.

const form = document.getElementById('certificate-form'); // missing when there are no students
const studentField = document.getElementById('student');
const typeField = document.getElementById('type');
const success = document.getElementById('success');
const message = document.getElementById('message');

function showError(text) {
  success.hidden = true;
  message.textContent = text;
  message.hidden = false;
}

// The page reloads after a successful action. To still show a confirmation message,
// we keep it in sessionStorage for one reload and display it here.
const flash = sessionStorage.getItem('flash');
if (flash) {
  success.textContent = flash;
  success.hidden = false;
  sessionStorage.removeItem('flash');
}

// ----- Issue a certificate -----
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.hidden = true;

    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentField.value, certificate_type: typeField.value }),
      });
      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('flash', 'Certificate issued. Verification code: ' + data.verification_code);
        window.location.reload();
        return;
      }
      showError(data.message || 'Something went wrong.');
    } catch (err) {
      showError('Could not reach the server. Please try again.');
    }
  });
}

// ----- Revoke a certificate -----
document.querySelectorAll('.revoke-button').forEach((button) => {
  button.addEventListener('click', async () => {
    if (!confirm('Revoke certificate ' + button.dataset.code + '? This cannot be undone.')) {
      return;
    }
    message.hidden = true;

    try {
      const response = await fetch(`/api/certificates/${button.dataset.id}/revoke`, { method: 'PATCH' });
      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('flash', 'Certificate ' + button.dataset.code + ' has been revoked.');
        window.location.reload();
        return;
      }
      showError(data.message || 'Something went wrong.');
    } catch (err) {
      showError('Could not reach the server. Please try again.');
    }
  });
});
