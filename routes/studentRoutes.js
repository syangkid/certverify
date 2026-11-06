// routes/studentRoutes.js
// URLs starting with /api/students (mounted in app.js). Institution staff and Admin only.

const express = require('express');
const studentController = require('../controllers/studentController');
const { requireAuth } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.use(requireAuth, roleGuard('ADMIN', 'INSTITUTION_STAFF'));

router.get('/', studentController.list);
router.post('/', studentController.create);
router.put('/:id', studentController.update);

module.exports = router;
