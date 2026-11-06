// models/Institution.js
// SQL for the institutions table.

const pool = require('../config/db');

async function findAll() {
  const result = await pool.query(
    'SELECT institution_id, institution_name, created_at FROM institutions ORDER BY institution_name'
  );
  return result.rows;
}

async function create(name) {
  const result = await pool.query(
    'INSERT INTO institutions (institution_name) VALUES ($1) RETURNING institution_id, institution_name, created_at',
    [name]
  );
  return result.rows[0];
}

async function update(id, name) {
  const result = await pool.query(
    `UPDATE institutions SET institution_name = $1 WHERE institution_id = $2
     RETURNING institution_id, institution_name, created_at`,
    [name, id]
  );
  return result.rows[0]; // undefined if the id does not exist
}

module.exports = { findAll, create, update };
