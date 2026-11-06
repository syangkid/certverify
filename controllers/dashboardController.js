// controllers/dashboardController.js
// Sends each user to the dashboard page that matches their role.

const dashboardViews = {
  ADMIN: 'admin/dashboard',
  INSTITUTION_STAFF: 'institution/dashboard',
  STUDENT: 'student/dashboard',
  VERIFIER: 'verification/dashboard',
};

function showDashboard(req, res) {
  res.render(dashboardViews[req.user.role], { title: 'Dashboard' });
}

module.exports = { showDashboard };
