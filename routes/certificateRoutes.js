// routes/certificateRoutes.js
// URLs starting with /api/certificates (mounted in app.js).

const express = require('express');
const certificateController = require('../controllers/certificateController');
const { requireAuth } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.use(requireAuth); // everything here needs a login; roles are checked per route

// Admin and staff see their scope; a student sees only their own certificates.
router.get('/', roleGuard('ADMIN', 'INSTITUTION_STAFF', 'STUDENT'), certificateController.list);
router.post('/', roleGuard('ADMIN', 'INSTITUTION_STAFF'), certificateController.issue);
router.patch('/:id/revoke', roleGuard('ADMIN', 'INSTITUTION_STAFF'), certificateController.revoke);

module.exports = router;
