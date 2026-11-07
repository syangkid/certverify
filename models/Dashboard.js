// models/Dashboard.js
// The numbers shown on each role's dashboard. One query per role.
// COUNT(...)::int turns PostgreSQL's big numbers into normal JavaScript numbers.

const pool = require('../config/db');

// Administrator: totals for the whole system.
async function adminCounts() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM institutions)::int AS institutions,
      (SELECT COUNT(*) FROM users)::int AS users,
      (SELECT COUNT(*) FROM students)::int AS students,
      (SELECT COUNT(*) FROM certificates WHERE status = 'ACTIVE')::int AS active_certificates,
      (SELECT COUNT(*) FROM certificates WHERE status = 'REVOKED')::int AS revoked_certificates,
      (SELECT COUNT(*) FROM verification_requests)::int AS verifications`);
  return result.rows[0];
}

// Institution staff: only their own institution.
async function staffCounts(institutionId) {
  const result = await pool.query(`
    SELECT
      (SELECT institution_name FROM institutions WHERE institution_id = $1) AS institution_name,
      (SELECT COUNT(*) FROM students WHERE institution_id = $1)::int AS students,
      (SELECT COUNT(*) FROM certificates WHERE institution_id = $1 AND status = 'ACTIVE')::int AS active_certificates,
      (SELECT COUNT(*) FROM certificates WHERE institution_id = $1 AND status = 'REVOKED')::int AS revoked_certificates,
      (SELECT COUNT(*) FROM verification_requests r
         JOIN certificates c ON c.certificate_id = r.certificate_id
         WHERE c.institution_id = $1)::int AS verifications`,
    [institutionId]
  );
  return result.rows[0];
}

// Student: only their own certificates.
async function studentCounts(userId) {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE c.status = 'ACTIVE')::int AS active_certificates,
      COUNT(*) FILTER (WHERE c.status = 'REVOKED')::int AS revoked_certificates
    FROM certificates c
    JOIN students s ON s.student_id = c.student_id
    WHERE s.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

// Verifier: only the checks they made while logged in, grouped by result.
async function verifierCounts(userId) {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE s.result_status = 'VALID')::int AS valid,
      COUNT(*) FILTER (WHERE s.result_status = 'REVOKED')::int AS revoked,
      COUNT(*) FILTER (WHERE s.result_status = 'NOT_FOUND')::int AS not_found,
      COUNT(*) FILTER (WHERE s.result_status = 'INVALID')::int AS invalid
    FROM verification_requests r
    JOIN verification_results s ON s.request_id = r.request_id
    WHERE r.verifier_id = $1`,
    [userId]
  );
  return result.rows[0];
}

module.exports = { adminCounts, staffCounts, studentCounts, verifierCounts };
