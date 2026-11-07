// routes/verificationHistoryRoutes.js
// GET /api/verifications (mounted in app.js): the saved verification history.
// Admin sees everything, staff see their institution's, a verifier sees their own.

const express = require('express');
const verificationController = require('../controllers/verificationController');
const { requireAuth } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.get('/', requireAuth, roleGuard('ADMIN', 'INSTITUTION_STAFF', 'VERIFIER'), verificationController.listHistory);

module.exports = router;
