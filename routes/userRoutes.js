// routes/userRoutes.js
// URLs starting with /api/users (mounted in app.js). Admin only.

const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.use(requireAuth, roleGuard('ADMIN'));

router.get('/', userController.list);
router.post('/', userController.create);
router.put('/:id', userController.update);

module.exports = router;
