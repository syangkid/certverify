const express = require('express');
const router = express.Router();

// The home page simply sends visitors to the login page.
router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('auth/login'); // views/auth/login.ejs
});

module.exports = router;
