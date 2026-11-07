// controllers/verificationController.js
// Public certificate verification. Anyone can verify, with or without logging in.

const Certificate = require('../models/Certificate');
const Verification = require('../models/Verification');
const eventBus = require('../events/eventBus');

// A well-formed code: "CERT-" followed by exactly 8 hexadecimal characters.
const CODE_FORMAT = /^CERT-[0-9A-F]{8}$/;

const MESSAGES = {
  VALID: 'This certificate is authentic and active.',
  REVOKED: 'This certificate was issued but has been revoked. It is no longer valid.',
  NOT_FOUND: 'No certificate was found with this verification code.',
  INVALID: 'This is not a valid verification code. Codes look like CERT-9F3A7C21.',
};

// POST /api/verify   body: { "code": "CERT-9F3A7C21" }
async function verify(req, res) {
  // Nothing to verify if no text was sent. (This is a bad request, not a verification attempt.)
  if (typeof req.body.code !== 'string' || !req.body.code.trim()) {
    return res.status(400).json({ message: 'Please enter a verification code' });
  }

  // What the person typed: cleaned up and limited to 50 characters. This is what we store.
  const submittedCode = req.body.code.replace(/\u0000/g, '').trim().slice(0, 50);
  // For matching we ignore upper/lower case: "cert-9f3a7c21" works too.
  const code = submittedCode.toUpperCase();

  // 1. Work out the result.
  let result;
  let certificate = null;

  if (!CODE_FORMAT.test(code)) {
    result = 'INVALID';                                  // wrong format: no database lookup needed
  } else {
    certificate = await Certificate.findByCode(code);
    if (!certificate) {
      result = 'NOT_FOUND';                              // right format, but no such certificate
    } else if (certificate.status === 'REVOKED') {
      result = 'REVOKED';
    } else {
      result = 'VALID';
    }
  }

  // 2. Save the attempt in PostgreSQL BEFORE answering, so history is never lost.
  //    req.user exists only if the person happens to be logged in.
  const requestId = await Verification.record({
    certificateId: certificate ? certificate.certificate_id : null,
    verifierId: req.user ? req.user.user_id : null,
    submittedCode,
    resultStatus: result,
  });

  // 3. The data is safely stored. Now announce it (listeners only do extra work such as logging).
  eventBus.emit('VerificationRequested', {
    requestId,
    submittedCode,
    result,
    certificateId: certificate ? certificate.certificate_id : null,
    verifier: req.user ? req.user.name : 'anonymous',
  });

  // 4. Answer. Only share the details a person checking a certificate needs.
  const response = { result, message: MESSAGES[result] };
  if (certificate) {
    response.certificate = {
      student_name: certificate.student_name,
      certificate_type: certificate.certificate_type,
      institution_name: certificate.institution_name,
      issued_at: certificate.issued_at,
      revoked_at: result === 'REVOKED' ? certificate.revoked_at : null,
    };
  }
  res.json(response);
}

// ---------- Added in Phase 7 (history) ----------

// Loads the history rows this user is allowed to see.
async function loadHistory(req) {
  if (req.user.role === 'ADMIN') {
    return Verification.findAll();                                   // everything
  }
  if (req.user.role === 'INSTITUTION_STAFF') {
    return Verification.findByInstitution(req.user.institution_id);  // their institution's certificates
  }
  return Verification.findByVerifier(req.user.user_id);              // VERIFIER: only their own checks
}

// GET /api/verifications
async function listHistory(req, res) {
  const history = await loadHistory(req);
  if (req.user.role === 'ADMIN') {
    return res.json(history);
  }
  // Only the Administrator sees WHO made each check.
  res.json(history.map(({ verifier_name, ...row }) => row));
}

// GET /verify/history  (web page)
async function showHistoryPage(req, res) {
  const history = await loadHistory(req);

  const scopeNotes = {
    ADMIN: 'All verification checks, including anonymous ones and failed attempts.',
    INSTITUTION_STAFF: "Checks of your institution's certificates.",
    VERIFIER: 'The checks you made while logged in.',
  };

  res.render('verification/history', {
    title: 'Verification History',
    history,
    scopeNote: scopeNotes[req.user.role],
    limit: Verification.HISTORY_LIMIT,
  });
}

module.exports = { verify, listHistory, showHistoryPage };
