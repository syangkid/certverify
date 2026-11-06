// controllers/institutionController.js
// Admin-only: list, add and rename institutions.

const Institution = require('../models/Institution');

// Reads and checks the name from the request body. Returns null if it is not valid.
function readName(req) {
  const name = String(req.body.institution_name || '').trim();
  return name && name.length <= 150 ? name : null;
}

// GET /admin/institutions  (web page)
async function showPage(req, res) {
  const institutions = await Institution.findAll();
  res.render('admin/institutions', { title: 'Institutions', institutions });
}

// GET /api/institutions
async function list(req, res) {
  res.json(await Institution.findAll());
}

// POST /api/institutions
async function create(req, res) {
  const name = readName(req);
  if (!name) {
    return res.status(400).json({ message: 'Institution name is required (maximum 150 characters)' });
  }
  try {
    const institution = await Institution.create(name);
    res.status(201).json(institution);
  } catch (err) {
    if (err.code === '23505') { // PostgreSQL "unique violation"
      return res.status(409).json({ message: 'An institution with that name already exists' });
    }
    throw err; // unexpected: let the error handler in app.js deal with it
  }
}

// PUT /api/institutions/:id
async function update(req, res) {
  const id = Number(req.params.id);
  const name = readName(req);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid institution id' });
  }
  if (!name) {
    return res.status(400).json({ message: 'Institution name is required (maximum 150 characters)' });
  }
  try {
    const institution = await Institution.update(id, name);
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }
    res.json(institution);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'An institution with that name already exists' });
    }
    throw err;
  }
}

module.exports = { showPage, list, create, update };
