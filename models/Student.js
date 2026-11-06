// models/Student.js
// SQL for the students table.
// Creating or updating a student can also touch the users table, so those two
// functions use a DATABASE TRANSACTION (all steps succeed, or none of them do).

const pool = require('../config/db');

// The columns we show in lists. LEFT JOIN users: a student may not have a login account.
const SELECT_STUDENTS = `
  SELECT s.student_id, s.name, s.student_number, s.institution_id, i.institution_name,
         s.user_id, u.email, u.status AS account_status
  FROM students s
  JOIN institutions i ON i.institution_id = s.institution_id
  LEFT JOIN users u ON u.user_id = s.user_id`;

// All students (for the Administrator).
async function findAll() {
  const result = await pool.query(`${SELECT_STUDENTS} ORDER BY s.student_id`);
  return result.rows;
}

// Only the students of ONE institution (for institution staff).
async function findByInstitution(institutionId) {
  const result = await pool.query(
    `${SELECT_STUDENTS} WHERE s.institution_id = $1 ORDER BY s.student_id`,
    [institutionId]
  );
  return result.rows;
}

async function findById(studentId) {
  const result = await pool.query(`${SELECT_STUDENTS} WHERE s.student_id = $1`, [studentId]);
  return result.rows[0];
}

// Inserts a login account (role STUDENT) using the given database connection.
// "client" is the connection that is inside the transaction.
async function insertStudentUser(client, { name, email, passwordHash, institutionId }) {
  const result = await client.query(
    `INSERT INTO users (name, email, password_hash, role_id, institution_id)
     VALUES ($1, $2, $3, (SELECT role_id FROM roles WHERE role_name = 'STUDENT'), $4)
     RETURNING user_id`,
    [name, email, passwordHash, institutionId]
  );
  return result.rows[0].user_id;
}

// Creates the student. If an email and password hash are given, it also creates the
// login account. Both rows are saved together, or neither is.
async function create({ name, studentNumber, institutionId, email, passwordHash }) {
  const client = await pool.connect(); // one connection for the whole transaction
  try {
    await client.query('BEGIN');

    let userId = null;
    if (email) {
      userId = await insertStudentUser(client, { name, email, passwordHash, institutionId });
    }

    const result = await client.query(
      `INSERT INTO students (name, student_number, institution_id, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING student_id, name, student_number, institution_id, user_id`,
      [name, studentNumber, institutionId, userId]
    );

    await client.query('COMMIT');   // save everything
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK'); // undo everything (e.g. the user row if the student insert failed)
    throw err;
  } finally {
    client.release();               // always give the connection back to the pool
  }
}

// Updates the student. "existing" is the student's current record.
//  - keeps the login account's name in step with the student's name
//  - if the student has no login yet and an email was given, creates one and links it
async function update(existing, { name, studentNumber, email, passwordHash }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let userId = existing.user_id;

    if (userId) {
      await client.query('UPDATE users SET name = $1 WHERE user_id = $2', [name, userId]);
    } else if (email) {
      userId = await insertStudentUser(client, {
        name, email, passwordHash, institutionId: existing.institution_id,
      });
    }

    const result = await client.query(
      `UPDATE students SET name = $1, student_number = $2, user_id = $3
       WHERE student_id = $4
       RETURNING student_id, name, student_number, institution_id, user_id`,
      [name, studentNumber, userId, existing.student_id]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { findAll, findByInstitution, findById, create, update };
