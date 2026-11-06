// routes/pageRoutes.js
// Routes that show web pages (they render EJS views).
// More pages are added here in later phases.

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const dashboardController = require('../controllers/dashboardController');
const institutionController = require('../controllers/institutionController');
const userController = require('../controllers/userController');
const studentController = require('../controllers/studentController');

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

// Admin pages
router.get('/admin/institutions', requireAuth, roleGuard('ADMIN'), institutionController.showPage);
router.get('/admin/users', requireAuth, roleGuard('ADMIN'), userController.showPage);

// Student management (institution staff and Admin)
router.get('/institution/students', requireAuth, roleGuard('ADMIN', 'INSTITUTION_STAFF'), studentController.showPage);

module.exports = router;
