// controllers/userController.js
// Admin-only: list users, create users and edit users.

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Institution = require('../models/Institution');

// Student accounts are NOT created here: staff create them together with the student record (Phase 4).
const CREATABLE_ROLES = ['ADMIN', 'INSTITUTION_STAFF', 'VERIFIER'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Turns the institution_id from the request into a whole number, or null if it is not valid.
function readInstitutionId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Converts known database errors into friendly API responses. Returns true if it handled one.
function handleDatabaseError(err, res) {
  if (err.code === '23505') { // unique violation (email)
    res.status(409).json({ message: 'That email is already registered' });
    return true;
  }
  if (err.code === '23503') { // foreign key violation (institution does not exist)
    res.status(400).json({ message: 'The selected institution does not exist' });
    return true;
  }
  return false;
}

// GET /admin/users  (web page)
async function showPage(req, res) {
  const users = await User.findAll();
  const institutions = await Institution.findAll();
  res.render('admin/users', { title: 'Users', users, institutions, creatableRoles: CREATABLE_ROLES });
}

// GET /api/users
async function list(req, res) {
  res.json(await User.findAll());
}

// POST /api/users
async function create(req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = String(req.body.role || '');

  if (!name || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'A name and a valid email are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  if (role === 'STUDENT') {
    return res.status(400).json({ message: 'Student accounts are created when institution staff register a student' });
  }
  if (!CREATABLE_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Role must be ADMIN, INSTITUTION_STAFF or VERIFIER' });
  }

  // Only institution staff belong to an institution.
  let institutionId = null;
  if (role === 'INSTITUTION_STAFF') {
    institutionId = readInstitutionId(req.body.institution_id);
    if (!institutionId) {
      return res.status(400).json({ message: 'Institution staff must belong to an institution' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10); // never store the plain password
  try {
    const user = await User.create({ name, email, passwordHash, role, institutionId });
    res.status(201).json(user);
  } catch (err) {
    if (handleDatabaseError(err, res)) return;
    throw err;
  }
}

// PUT /api/users/:id   (the role cannot be changed after creation)
async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  const existing = await User.findById(id);
  if (!existing) {
    return res.status(404).json({ message: 'User not found' });
  }

  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const status = String(req.body.status || '');
  const password = String(req.body.password || '');

  if (!name || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'A name and a valid email are required' });
  }
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE' });
  }
  // Prevents the administrator from locking themselves out.
  if (id === req.user.user_id && status === 'INACTIVE') {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  // Only staff can be moved to another institution; for everyone else it stays as it is.
  let institutionId = existing.institution_id;
  if (existing.role === 'INSTITUTION_STAFF') {
    institutionId = readInstitutionId(req.body.institution_id);
    if (!institutionId) {
      return res.status(400).json({ message: 'Institution staff must belong to an institution' });
    }
  }

  // A new password is optional. Leaving it blank keeps the current one.
  let passwordHash = null;
  if (password) {
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    const user = await User.update(id, { name, email, status, institutionId, passwordHash });
    res.json(user);
  } catch (err) {
    if (handleDatabaseError(err, res)) return;
    throw err;
  }
}

module.exports = { showPage, list, create, update };
