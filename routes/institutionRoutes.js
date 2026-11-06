// routes/institutionRoutes.js
// URLs starting with /api/institutions (mounted in app.js). Admin only.

const express = require('express');
const institutionController = require('../controllers/institutionController');
const { requireAuth } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

// Every route in this file needs a logged-in ADMIN.
router.use(requireAuth, roleGuard('ADMIN'));

router.get('/', institutionController.list);
router.post('/', institutionController.create);
router.put('/:id', institutionController.update);

module.exports = router;
