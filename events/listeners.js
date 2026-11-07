// events/listeners.js
// Registers what should happen when an event is emitted.
// This file is loaded once in app.js.

const eventBus = require('./eventBus');

// CertificateIssued: emitted by certificateController after a certificate is saved.
eventBus.on('CertificateIssued', (data) => {
  // Listeners run immediately and inside the request. A crash here must never break
  // the request after the certificate is already saved, so everything is wrapped in try/catch.
  try {
    console.log(
      `[EVENT] CertificateIssued: ${data.verificationCode} (${data.certificateType}) ` +
      `issued to ${data.studentName} (${data.studentNumber}) by ${data.issuedBy} at ${data.issuedAt.toISOString()}`
    );
  } catch (err) {
    console.error('CertificateIssued listener failed:', err.message);
  }
});

// VerificationRequested: emitted by verificationController AFTER the request and result
// have been saved in PostgreSQL. The history is already safe; this only does extra work.
eventBus.on('VerificationRequested', (data) => {
  try {
    // JSON.stringify shows the typed text in quotes, so odd characters cannot fake log lines.
    const typed = JSON.stringify(data.submittedCode);
    console.log(`[EVENT] VerificationRequested: ${typed} -> ${data.result} (request #${data.requestId}, by ${data.verifier})`);

    if (data.result === 'REVOKED' || data.result === 'NOT_FOUND') {
      console.warn(`[ALERT] A ${data.result} certificate code was checked: ${typed}`);
    }
  } catch (err) {
    console.error('VerificationRequested listener failed:', err.message);
  }
});

console.log('Event listeners registered: CertificateIssued, VerificationRequested');
