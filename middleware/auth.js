// middleware/auth.js
// Two small middleware functions that answer "who is making this request?"
//   optionalAuth: identifies the user if there is a valid login cookie, but lets everyone through.
//   requireAuth:  blocks anyone who is not logged in.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Runs on every request (see app.js). Sets req.user, or null for visitors.
async function optionalAuth(req, res, next) {
  req.user = null;

  const token = req.cookies.token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET); // fails if fake or expired
      const user = await User.findById(payload.userId);
      // Inactive accounts are treated as logged out immediately.
      if (user && user.status === 'ACTIVE') {
        req.user = user;
      }
    } catch (err) {
      // Bad or expired token: simply treat the visitor as not logged in.
    }
  }

  // res.locals makes "user" available inside every EJS template.
  res.locals.user = req.user;
  next();
}

// Put this on any route that needs a logged-in user.
function requireAuth(req, res, next) {
  if (req.user) {
    return next();
  }
  if (req.originalUrl.startsWith('/api')) {
    return res.status(401).json({ message: 'Please log in first' });
  }
  res.redirect('/login');
}

module.exports = { optionalAuth, requireAuth };
