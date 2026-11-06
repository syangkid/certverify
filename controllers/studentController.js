// controllers/studentController.js
// Institution staff and the Administrator manage students here.
//   Staff: can only see and change students of THEIR OWN institution.
//   Admin: can see and change all students.

const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Institution = require('../models/Institution');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStaff(req) {
  return req.user.role === 'INSTITUTION_STAFF';
}

// Reads the optional login-account fields.
// Returns null if no account was requested, { error } if the fields are not valid,
// or { email, password } if everything is fine.
function readAccountFields(req) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email && !password) return null;
  if (!EMAIL_PATTERN.test(email)) return { error: 'A valid email is required for the login account' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters' };
  return { email, password };
}

// Turns known database errors into friendly responses. Returns true if it handled one.
// err.constraint tells us WHICH unique rule was broken.
function handleDatabaseError(err, res) {
  if (err.code === '23505') {
    if (err.constraint === 'students_institution_id_student_number_key') {
      res.status(409).json({ message: 'That student number already exists in this institution' });
    } else {
      res.status(409).json({ message: 'That email is already registered' });
    }
    return true;
  }
  if (err.code === '23503') {
    res.status(400).json({ message: 'The selected institution does not exist' });
    return true;
  }
  return false;
}

// GET /institution/students  (web page)
async function showPage(req, res) {
  const students = isStaff(req)
    ? await Student.findByInstitution(req.user.institution_id)
    : await Student.findAll();
  // Only the Administrator needs the institution dropdown.
  const institutions = isStaff(req) ? [] : await Institution.findAll();

  res.render('institution/students', { title: 'Students', students, institutions });
}

// GET /api/students
async function list(req, res) {
  const students = isStaff(req)
    ? await Student.findByInstitution(req.user.institution_id)
    : await Student.findAll();
  res.json(students);
}

// POST /api/students
async function create(req, res) {
  const name = String(req.body.name || '').trim();
  const studentNumber = String(req.body.student_number || '').trim();

  if (!name || name.length > 100 || !studentNumber || studentNumber.length > 50) {
    return res.status(400).json({ message: 'Student name and student number are required' });
  }

  // Which institution does the new student belong to?
  let institutionId;
  if (isStaff(req)) {
    // Staff: ALWAYS their own institution. Anything sent in the request is ignored.
    institutionId = req.user.institution_id;
    if (!institutionId) {
      return res.status(403).json({ message: 'Your account is not linked to an institution' });
    }
  } else {
    // Admin: must choose one.
    institutionId = Number(req.body.institution_id);
    if (!Number.isInteger(institutionId) || institutionId < 1) {
      return res.status(400).json({ message: 'Please choose an institution' });
    }
  }

  const account = readAccountFields(req);
  if (account && account.error) {
    return res.status(400).json({ message: account.error });
  }
  const passwordHash = account ? await bcrypt.hash(account.password, 10) : null;

  try {
    const student = await Student.create({
      name,
      studentNumber,
      institutionId,
      email: account ? account.email : null,
      passwordHash,
    });
    res.status(201).json(student);
  } catch (err) {
    if (handleDatabaseError(err, res)) return;
    throw err;
  }
}

// PUT /api/students/:id
async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid student id' });
  }

  const existing = await Student.findById(id);
  // Staff asking for another institution's student get the SAME answer as for a missing student.
  if (!existing || (isStaff(req) && existing.institution_id !== req.user.institution_id)) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const name = String(req.body.name || '').trim();
  const studentNumber = String(req.body.student_number || '').trim();
  if (!name || name.length > 100 || !studentNumber || studentNumber.length > 50) {
    return res.status(400).json({ message: 'Student name and student number are required' });
  }

  // A login can only be added if the student does not have one yet.
  let account = null;
  if (!existing.user_id) {
    account = readAccountFields(req);
    if (account && account.error) {
      return res.status(400).json({ message: account.error });
    }
  }
  const passwordHash = account ? await bcrypt.hash(account.password, 10) : null;

  try {
    const student = await Student.update(existing, {
      name,
      studentNumber,
      email: account ? account.email : null,
      passwordHash,
    });
    res.json(student);
  } catch (err) {
    if (handleDatabaseError(err, res)) return;
    throw err;
  }
}

module.exports = { showPage, list, create, update };
