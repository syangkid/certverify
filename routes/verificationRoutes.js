// routes/verificationRoutes.js
// POST /api/verify (mounted in app.js). Public: no login needed.

const express = require('express');
const rateLimit = require('express-rate-limit');
const verificationController = require('../controllers/verificationController');

const router = express.Router();

// At most 20 verification requests per minute from one IP address.
// This stops people from trying thousands of codes to guess a real one.
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many verification requests. Please wait a minute and try again.' },
});

router.post('/', verifyLimiter, verificationController.verify);

module.exports = router;
