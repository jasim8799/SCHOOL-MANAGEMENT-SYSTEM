const PDFDocument = require('pdfkit');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const School = require('../models/School');
const Class = require('../models/Class');
const { ROLES } = require('../config/constants');

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().split('T')[0];
}

async function authorizeStudentAccess({ role, userId, student, schoolId }) {
  if (!student || String(student.schoolId) !== String(schoolId)) return { ok: false, status: 404, error: 'Student not found' };
  if (role === ROLES.PRINCIPAL || role === ROLES.OPERATOR) return { ok: true };
  if (role === ROLES.STUDENT) {
    if (String(userId) !== String(student._id)) return { ok: false, status: 403, error: 'Not authorized' };
    return { ok: true };
  }
  if (role === ROLES.PARENT) {
    if (!student.parentIds || !student.parentIds.map(String).includes(String(userId))) {
      return { ok: false, status: 403, error: 'Not authorized' };
    }
    return { ok: true };
  }
  return { ok: false, status: 403, error: 'Not authorized' };
}

async function getAdmitCard(req, res, next) {
  try {
    const { examId, studentId } = req.params;
    const schoolId = req.user.schoolId;
    const role = req.user.role;

    const exam = await Exam.findOne({ _id: examId, schoolId });
    if (!exam || !exam.admitCardEnabled) return res.status(404).json({ error: 'Admit card not available' });

    const student = await Student.findOne({ _id: studentId, schoolId }).select('name admissionNumber classId parentIds schoolId');
    const access = await authorizeStudentAccess({ role, userId: req.user.userId, student, schoolId });
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    const school = await School.findOne({ $or: [{ _id: schoolId }, { schoolId }] }).select('name logoUrl domain');
    const cls = student && student.classId ? await Class.findOne({ _id: student.classId, schoolId }).select('name section') : null;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="admit-${examId}-${studentId}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text(school?.name || 'School', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text('Admit Card', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(13).text(exam.examName || exam.name || 'Exam', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(12).text(`Student: ${student?.name || ''}`);
    doc.text(`Admission No: ${student?.admissionNumber || ''}`);
    doc.text(`Class: ${cls ? `${cls.name || ''}${cls.section ? ' - ' + cls.section : ''}` : '-'}`);
    doc.text(`Exam Dates: ${formatDate(exam.startDate)} - ${formatDate(exam.endDate)}`);
    doc.moveDown(0.8);

    doc.fontSize(12).text('Subjects:', { underline: true });
    const subjects = exam.subjects || [];
    if (subjects.length === 0) {
      doc.text('No subjects provided');
    } else {
      subjects.forEach((s, idx) => {
        const subName = s.subject || `Subject ${idx + 1}`;
        const subDate = formatDate(s.date);
        doc.text(`${subName} - ${subDate}`);
      });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAdmitCard };
