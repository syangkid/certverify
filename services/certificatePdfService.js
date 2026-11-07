
// services/certificatePdfService.js
// Generates a downloadable PDF certificate without a QR code.

const PDFDocument = require('pdfkit');
const path = require('path');

async function generateCertificatePdf(certificate, verificationUrl, response) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: {
      top: 45,
      bottom: 45,
      left: 55,
      right: 55,
    },
    info: {
      Title: certificate.certificate_type,
      Author: 'Sherubtse College',
      Subject: 'Academic Certificate',
    },
  });

  doc.pipe(response);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const center = pageWidth / 2;
  const logoPath = path.join(__dirname, '../public/images/logo.png');

  // Outer and inner decorative borders.
  doc.lineWidth(3)
    .strokeColor('#B08D45')
    .rect(25, 25, pageWidth - 50, pageHeight - 50)
    .stroke();

  doc.lineWidth(1)
    .strokeColor('#B08D45')
    .rect(33, 33, pageWidth - 66, pageHeight - 66)
    .stroke();

  // College logo.
  doc.image(logoPath, center - 38, 48, {
    fit: [76, 76],
    align: 'center',
  });

  // Institution heading.
  doc.font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#183B56')
    .text('SHERUBTSE COLLEGE', 55, 132, {
      align: 'center',
      width: pageWidth - 110,
    });

  doc.font('Helvetica')
    .fontSize(10)
    .fillColor('#555555')
    .text('CERTIFICATE OF ACHIEVEMENT', 55, 158, {
      align: 'center',
      width: pageWidth - 110,
      characterSpacing: 2,
    });

  // Certificate heading.
  doc.moveTo(280, 185)
    .lineTo(pageWidth - 280, 185)
    .strokeColor('#B08D45')
    .stroke();

  doc.font('Times-Bold')
    .fontSize(30)
    .fillColor('#183B56')
    .text('Certificate of Recognition', 55, 205, {
      align: 'center',
      width: pageWidth - 110,
    });

  // Recipient information.
  doc.font('Helvetica')
    .fontSize(13)
    .fillColor('#444444')
    .text('This certificate is proudly presented to', 55, 260, {
      align: 'center',
      width: pageWidth - 110,
    });

  doc.font('Times-Bold')
    .fontSize(27)
    .fillColor('#222222')
    .text(certificate.student_name, 75, 287, {
      align: 'center',
      width: pageWidth - 150,
    });

  doc.font('Helvetica')
    .fontSize(13)
    .fillColor('#444444')
    .text('in recognition of successfully completing', 55, 330, {
      align: 'center',
      width: pageWidth - 110,
    });

  doc.font('Helvetica-Bold')
    .fontSize(17)
    .fillColor('#183B56')
    .text(certificate.certificate_type, 75, 355, {
      align: 'center',
      width: pageWidth - 150,
    });

  doc.font('Helvetica')
    .fontSize(11)
    .fillColor('#555555')
    .text(certificate.institution_name, 55, 385, {
      align: 'center',
      width: pageWidth - 110,
    });

  // President's authorised-signatory section.
  doc.moveTo(100, 470)
    .lineTo(290, 470)
    .strokeColor('#444444')
    .lineWidth(0.8)
    .stroke();

  doc.font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#222222')
    .text('President', 100, 477, {
      width: 190,
      align: 'center',
    });

  doc.font('Helvetica')
    .fontSize(9)
    .text('Sherubtse College', 100, 492, {
      width: 190,
      align: 'center',
    });

  // Issue date and certificate reference.
  const issueDate = new Date(certificate.issued_at).toLocaleDateString(
    'en-GB',
    { timeZone: 'Asia/Thimphu' }
  );

  doc.font('Helvetica')
    .fontSize(10)
    .fillColor('#444444')
    .text(`Date of Issue: ${issueDate}`, 330, 455, {
      width: 190,
      align: 'center',
    });

  doc.font('Helvetica-Bold')
    .fontSize(9)
    .text(`Certificate ID: ${certificate.certificate_id}`, 330, 475, {
      width: 190,
      align: 'center',
    });

  // Display verification code as text (no QR code).
  doc.font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#183B56')
    .text(`Verification Code: ${certificate.verification_code}`, 330, 495, {
      width: 190,
      align: 'center',
    });

  // Clearly identify revoked certificates.
  if (certificate.status === 'REVOKED') {
    doc.save();

    doc.rect(pageWidth - 245, 65, 180, 35)
      .lineWidth(2)
      .strokeColor('#B42318')
      .stroke();

    doc.font('Helvetica-Bold')
      .fontSize(19)
      .fillColor('#B42318')
      .text('REVOKED', pageWidth - 240, 73, {
        width: 170,
        align: 'center',
      });

    doc.restore();
  }

  doc.end();
}

module.exports = { generateCertificatePdf };
