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

module.exports = { record };
