// controllers/authController.js
// Handles login and logout requests (HTTP in, HTTP out).

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EIGHT_HOURS = 8 * 60 * 60 * 1000; // in milliseconds

// Settings for the login cookie.
const cookieOptions = {
  httpOnly: true,                                  // JavaScript in the browser cannot read it
  sameSite: 'lax',                                 // not sent with cross-site POST requests
  secure: process.env.NODE_ENV === 'production',   // HTTPS only when deployed
};

// POST /api/auth/login
async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findByEmail(email);

  // Compare the typed password with the stored bcrypt hash.
  const passwordCorrect = user ? await bcrypt.compare(password, user.password_hash) : false;

  // One message for both "no such email" and "wrong password",
  // so attackers cannot discover which emails exist.
  if (!passwordCorrect) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ message: 'This account is inactive. Please contact the administrator.' });
  }

  // The token only stores the user id. Everything else is loaded from the database on each request.
  const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie('token', token, { ...cookieOptions, maxAge: EIGHT_HOURS });

  res.json({ message: 'Login successful', user: { name: user.name, role: user.role } });
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie('token', cookieOptions);
  res.json({ message: 'Logged out' });
}

// GET /api/auth/me  (handy for Postman: shows who is logged in)
function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, logout, me };
