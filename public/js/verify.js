// public/js/verify.js
// Runs in the browser on the Verify page. Sends the code to POST /api/verify
// and shows one of four results: VALID, REVOKED, NOT_FOUND or INVALID.

const form = document.getElementById('verify-form');
const codeField = document.getElementById('code');
const button = document.getElementById('verify-button');
const message = document.getElementById('message');
const resultBox = document.getElementById('result');
const resultStatus = document.getElementById('result-status');
const resultMessage = document.getElementById('result-message');
const details = document.getElementById('result-details');
const labelRevoked = document.getElementById('label-revoked');
const detailRevoked = document.getElementById('detail-revoked');

// Short headings and CSS classes for each result.
const TITLES = {
  VALID: 'VALID',
  REVOKED: 'REVOKED',
  NOT_FOUND: 'NOT FOUND',
  INVALID: 'INVALID CODE',
};

function showError(text) {
  resultBox.hidden = true;
  message.textContent = text;
  message.hidden = false;
}

function formatDate(isoText) {
  return isoText ? isoText.slice(0, 10) : '';
}

function showResult(data) {
  // textContent (not innerHTML) so text from the server can never be run as HTML.
  resultBox.className = 'card result result-' + data.result.toLowerCase().replace('_', '-');
  resultStatus.textContent = TITLES[data.result] || data.result;
  resultMessage.textContent = data.message;

  if (data.certificate) {
    document.getElementById('detail-student').textContent = data.certificate.student_name;
    document.getElementById('detail-type').textContent = data.certificate.certificate_type;
    document.getElementById('detail-institution').textContent = data.certificate.institution_name;
    document.getElementById('detail-issued').textContent = formatDate(data.certificate.issued_at);

    const revoked = Boolean(data.certificate.revoked_at);
    labelRevoked.hidden = !revoked;
    detailRevoked.hidden = !revoked;
    detailRevoked.textContent = formatDate(data.certificate.revoked_at);
    details.hidden = false;
  } else {
    details.hidden = true;
  }
  resultBox.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;
  button.disabled = true;
  button.textContent = 'Verifying...';

  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeField.value }),
    });
    const data = await response.json();

    if (response.ok) {
      showResult(data);
    } else {
      showError(data.message || 'Something went wrong.'); // e.g. the "too many requests" message
    }
  } catch (err) {
    showError('Could not reach the server. Please try again.');
  }

  button.disabled = false;
  button.textContent = 'Verify';
});
