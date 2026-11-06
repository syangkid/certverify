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

// ---------- Added in Phase 3 (used by the Admin user-management pages) ----------

// All users, with their role name and institution name.
async function findAll() {
  const result = await pool.query(
    `SELECT u.user_id, u.name, u.email, u.status, u.institution_id, u.created_at,
            r.role_name AS role, i.institution_name
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     LEFT JOIN institutions i ON i.institution_id = u.institution_id
     ORDER BY u.user_id`
  );
  return result.rows;
}

// Insert a new user. The role id is looked up from the role name inside the SQL.
async function create({ name, email, passwordHash, role, institutionId }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role_id, institution_id)
     VALUES ($1, $2, $3, (SELECT role_id FROM roles WHERE role_name = $4), $5)
     RETURNING user_id, name, email, status, institution_id`,
    [name, email, passwordHash, role, institutionId]
  );
  return result.rows[0];
}

// Update a user. COALESCE keeps the old password when no new one is given (null).
async function update(id, { name, email, status, institutionId, passwordHash }) {
  const result = await pool.query(
    `UPDATE users
     SET name = $1, email = $2, status = $3, institution_id = $4,
         password_hash = COALESCE($5, password_hash)
     WHERE user_id = $6
     RETURNING user_id, name, email, status, institution_id`,
    [name, email, status, institutionId, passwordHash, id]
  );
  return result.rows[0];
}

module.exports.findAll = findAll;
module.exports.create = create;
module.exports.update = update;
