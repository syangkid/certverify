// models/User.js
// The model talks to the database. It contains SQL and nothing else:
// no req/res, no business rules.

const pool = require('../config/db');

// Find a user by email. Used at login, so it includes the password hash.
async function findByEmail(email) {
  const result = await pool.query(
    `SELECT u.user_id, u.name, u.email, u.password_hash, u.status,
            u.institution_id, r.role_name AS role
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0]; // undefined if nobody has that email
}

// Find a user by id. Used on every request after login, so it NEVER returns the password hash.
async function findById(userId) {
  const result = await pool.query(
    `SELECT u.user_id, u.name, u.email, u.status,
            u.institution_id, r.role_name AS role
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

module.exports = { findByEmail, findById };
