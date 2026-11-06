// middleware/roleGuard.js
// Allows a route only for certain roles. Always use it AFTER requireAuth.
// Example:  router.get('/users', requireAuth, roleGuard('ADMIN'), controller.list);

function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) {
      return next();
    }
    if (req.originalUrl.startsWith('/api')) {
      return res.status(403).json({ message: 'You do not have permission to do that' });
    }
    res.status(403).render('error', {
      title: 'Access denied',
      status: 403,
      message: 'You do not have permission to view this page.',
    });
  };
}

module.exports = roleGuard;
