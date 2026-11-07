// controllers/dashboardController.js
// Shows each user the dashboard for their role, with the numbers they are allowed to see.

const Dashboard = require('../models/Dashboard');

const dashboardViews = {
  ADMIN: 'admin/dashboard',
  INSTITUTION_STAFF: 'institution/dashboard',
  STUDENT: 'student/dashboard',
  VERIFIER: 'verification/dashboard',
};

async function showDashboard(req, res) {
  const role = req.user.role;
  let stats;

  if (role === 'ADMIN') {
    stats = await Dashboard.adminCounts();
  } else if (role === 'INSTITUTION_STAFF') {
    stats = await Dashboard.staffCounts(req.user.institution_id);
  } else if (role === 'STUDENT') {
    stats = await Dashboard.studentCounts(req.user.user_id);
  } else {
    stats = await Dashboard.verifierCounts(req.user.user_id);
  }

  res.render(dashboardViews[role], { title: 'Dashboard', stats });
}

module.exports = { showDashboard };
