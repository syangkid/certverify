// controllers/certificateController.js
// Issue certificates, list them and revoke them.
//   Staff: only their own institution's students and certificates.
//   Admin: everything.
//   Student: can only list their own certificates.

const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const Student = require('../models/Student');
const eventBus = require('../events/eventBus');

const MAX_CODE_ATTEMPTS = 5;

function isStaff(req) {
  return req.user.role === 'INSTITUTION_STAFF';
}

// Creates a code like CERT-9F3A7C21: "CERT-" + 8 random hexadecimal characters.
// randomBytes(4) = 4 random bytes = 8 hex characters.
function generateVerificationCode() {
  return 'CERT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET /institution/certificates  (web page)
async function showPage(req, res) {
  const certificates = isStaff(req)
    ? await Certificate.findByInstitution(req.user.institution_id)
    : await Certificate.findAll();
  // The students the user is allowed to issue certificates to.
  const students = isStaff(req)
    ? await Student.findByInstitution(req.user.institution_id)
    : await Student.findAll();

  res.render('institution/certificates', { title: 'Certificates', certificates, students });
}

// GET /api/certificates
async function list(req, res) {
  let certificates;
  if (req.user.role === 'STUDENT') {
    certificates = await Certificate.findByStudentUser(req.user.user_id);
  } else if (isStaff(req)) {
    certificates = await Certificate.findByInstitution(req.user.institution_id);
  } else {
    certificates = await Certificate.findAll();
  }
  res.json(certificates);
}

// POST /api/certificates
async function issue(req, res) {
  const studentId = Number(req.body.student_id);
  const certificateType = String(req.body.certificate_type || '').trim();

  if (!Number.isInteger(studentId) || !certificateType || certificateType.length > 100) {
    return res.status(400).json({ message: 'A student and a certificate type are required' });
  }

  const student = await Student.findById(studentId);
  // Staff asking for another institution's student get the same answer as for a missing student.
  if (!student || (isStaff(req) && student.institution_id !== req.user.institution_id)) {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Try to save with a new random code. The UNIQUE rule in PostgreSQL is the real guard
  // against duplicates: if a code already exists the insert fails and we simply try another code.
  let certificate;
  for (let attempt = 1; !certificate; attempt++) {
    try {
      certificate = await Certificate.create({
        studentId: student.student_id,
        institutionId: student.institution_id, // the certificate belongs to the student's institution
        certificateType,
        verificationCode: generateVerificationCode(),
        issuedBy: req.user.user_id,
      });
    } catch (err) {
      const codeAlreadyExists = err.code === '23505' && err.constraint === 'certificates_verification_code_key';
      if (!codeAlreadyExists || attempt === MAX_CODE_ATTEMPTS) {
        throw err;
      }
    }
  }

  // The certificate is saved. Now announce it. Listeners (events/listeners.js) react to this.
  eventBus.emit('CertificateIssued', {
    certificateId: certificate.certificate_id,
    verificationCode: certificate.verification_code,
    certificateType: certificate.certificate_type,
    studentName: student.name,
    studentNumber: student.student_number,
    issuedBy: req.user.name,
    issuedAt: certificate.issued_at,
  });

  res.status(201).json(certificate);
}

// PATCH /api/certificates/:id/revoke
async function revoke(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid certificate id' });
  }

  const certificate = await Certificate.findById(id);
  if (!certificate || (isStaff(req) && certificate.institution_id !== req.user.institution_id)) {
    return res.status(404).json({ message: 'Certificate not found' });
  }

  const revoked = await Certificate.revoke(id);
  if (!revoked) {
    return res.status(409).json({ message: 'This certificate is already revoked' });
  }
  res.json(revoked);
}

// GET /student/certificates  (web page: a student's own certificates)
async function showMyCertificates(req, res) {
  const certificates = await Certificate.findByStudentUser(req.user.user_id);
  res.render('student/certificates', { title: 'My Certificates', certificates });
}

module.exports = { showPage, list, issue, revoke, showMyCertificates };
