// routes/pageRoutes.js
// Routes that show web pages (they render EJS views).
// More pages are added here in later phases.

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Home: go to the dashboard (requireAuth sends visitors to /login instead).
router.get('/', (req, res) => {
  res.redirect('/dashboard');
});

router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard'); // already logged in
  }
  res.render('auth/login');
});

router.get('/dashboard', requireAuth, dashboardController.showDashboard);

module.exports = router;
