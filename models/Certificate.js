// models/Certificate.js
// SQL for the certificates table.

const pool = require('../config/db');

// The columns shown in lists: the certificate plus the student, institution and issuer names.
const SELECT_CERTIFICATES = `
  SELECT c.certificate_id, c.certificate_type, c.status, c.verification_code,
         c.issued_at, c.revoked_at, c.student_id, c.institution_id,
         s.name AS student_name, s.student_number,
         i.institution_name, u.name AS issued_by_name
  FROM certificates c
  JOIN students s ON s.student_id = c.student_id
  JOIN institutions i ON i.institution_id = c.institution_id
  JOIN users u ON u.user_id = c.issued_by`;

// All certificates (Administrator).
async function findAll() {
  const result = await pool.query(`${SELECT_CERTIFICATES} ORDER BY c.certificate_id DESC`);
  return result.rows;
}

// Certificates of one institution (institution staff).
async function findByInstitution(institutionId) {
  const result = await pool.query(
    `${SELECT_CERTIFICATES} WHERE c.institution_id = $1 ORDER BY c.certificate_id DESC`,
    [institutionId]
  );
  return result.rows;
}

// Certificates of the student who owns this login account (student role).
async function findByStudentUser(userId) {
  const result = await pool.query(
    `${SELECT_CERTIFICATES} WHERE s.user_id = $1 ORDER BY c.certificate_id DESC`,
    [userId]
  );
  return result.rows;
}

async function findById(certificateId) {
  const result = await pool.query(`${SELECT_CERTIFICATES} WHERE c.certificate_id = $1`, [certificateId]);
  return result.rows[0];
}

// Saves a new certificate. The status defaults to ACTIVE and issued_at to now (see schema.sql).
async function create({ studentId, institutionId, certificateType, verificationCode, issuedBy }) {
  const result = await pool.query(
    `INSERT INTO certificates (student_id, institution_id, certificate_type, verification_code, issued_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING certificate_id, student_id, institution_id, certificate_type, status, verification_code, issued_at`,
    [studentId, institutionId, certificateType, verificationCode, issuedBy]
  );
  return result.rows[0];
}

// Marks a certificate as REVOKED. "AND status = 'ACTIVE'" means an already revoked
// certificate is not changed again (the function then returns undefined).
async function revoke(certificateId) {
  const result = await pool.query(
    `UPDATE certificates SET status = 'REVOKED', revoked_at = NOW()
     WHERE certificate_id = $1 AND status = 'ACTIVE'
     RETURNING certificate_id, status, revoked_at`,
    [certificateId]
  );
  return result.rows[0];
}

module.exports = { findAll, findByInstitution, findByStudentUser, findById, create, revoke };

// ---------- Added in Phase 6 (used by public verification) ----------

// Finds a certificate by its verification code. Returns undefined if there is none.
async function findByCode(verificationCode) {
  const result = await pool.query(`${SELECT_CERTIFICATES} WHERE c.verification_code = $1`, [verificationCode]);
  return result.rows[0];
}

module.exports.findByCode = findByCode;
