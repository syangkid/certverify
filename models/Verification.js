// models/Verification.js
// Saves verification history: one row in verification_requests and one row in
// verification_results for every verification attempt.

const pool = require('../config/db');

// Saves the request and its result in ONE TRANSACTION: both rows are saved, or neither is.
// certificateId is null when the code was INVALID or NOT_FOUND.
// verifierId is null when the person was not logged in.
// Returns the new request id.
async function record({ certificateId, verifierId, submittedCode, resultStatus }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const request = await client.query(
      `INSERT INTO verification_requests (certificate_id, verifier_id, submitted_code)
       VALUES ($1, $2, $3)
       RETURNING request_id`,
      [certificateId, verifierId, submittedCode]
    );
    const requestId = request.rows[0].request_id;

    await client.query(
      'INSERT INTO verification_results (request_id, result_status) VALUES ($1, $2)',
      [requestId, resultStatus]
    );

    await client.query('COMMIT');
    return requestId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- Added in Phase 7 (history pages) ----------

// Each history row: the request, its result, and (if a certificate was found) its details.
// LEFT JOIN keeps INVALID / NOT_FOUND rows, which have no certificate, and anonymous rows,
// which have no verifier.
const SELECT_HISTORY = `
  SELECT r.request_id, r.submitted_code, r.request_date, s.result_status,
         c.certificate_type, st.name AS student_name, i.institution_name,
         u.name AS verifier_name
  FROM verification_requests r
  JOIN verification_results s ON s.request_id = r.request_id
  LEFT JOIN certificates c ON c.certificate_id = r.certificate_id
  LEFT JOIN students st ON st.student_id = c.student_id
  LEFT JOIN institutions i ON i.institution_id = c.institution_id
  LEFT JOIN users u ON u.user_id = r.verifier_id`;

// Anyone can submit codes, so the table can grow large. Only the newest rows are loaded.
const HISTORY_LIMIT = 200;

// Everything (Administrator).
async function findAll() {
  const result = await pool.query(`${SELECT_HISTORY} ORDER BY r.request_id DESC LIMIT ${HISTORY_LIMIT}`);
  return result.rows;
}

// Only the checks made by one logged-in verifier.
async function findByVerifier(userId) {
  const result = await pool.query(
    `${SELECT_HISTORY} WHERE r.verifier_id = $1 ORDER BY r.request_id DESC LIMIT ${HISTORY_LIMIT}`,
    [userId]
  );
  return result.rows;
}

// Only the checks of one institution's certificates (institution staff).
async function findByInstitution(institutionId) {
  const result = await pool.query(
    `${SELECT_HISTORY} WHERE c.institution_id = $1 ORDER BY r.request_id DESC LIMIT ${HISTORY_LIMIT}`,
    [institutionId]
  );
  return result.rows;
}

module.exports = { record, findAll, findByVerifier, findByInstitution, HISTORY_LIMIT };
