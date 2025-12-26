const Student = require('../models/Student');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const { hashPassword } = require('../utils/password');
const { dispatchNotification } = require('../services/notificationDispatcher');

function buildDocuments(docs = []) {
  if (!Array.isArray(docs)) return [];
  return docs
    .filter(Boolean)
    .map((d) => ({
      type: d.type || 'document',
      url: d.url || '',
      uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : new Date()
    }))
    .filter((d) => !!d.url);
}

async function ensureParent({ name, email, schoolId, createdBy }) {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase();
  let parent = await User.findOne({ email: normalizedEmail, schoolId, role: ROLES.PARENT });
  if (parent) return parent;
  const passwordHash = await hashPassword('welcome123');
  parent = await User.create({
    schoolId,
    name: name || 'Parent',
    email: normalizedEmail,
    passwordHash,
    role: ROLES.PARENT,
    createdBy
  });
  return parent;
}

async function createStudent(req, res, next) {
  try {
    const { name, admissionNumber, admissionDate, classId, parentName, parentEmail, documents } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const schoolId = req.user.schoolId;
    const createdBy = req.user.userId;

    const parent = await ensureParent({ name: parentName, email: parentEmail, schoolId, createdBy });

    const student = await Student.create({
      schoolId,
      name,
      admissionNumber,
      admissionDate: admissionDate ? new Date(admissionDate) : undefined,
      classId,
      parentIds: parent ? [parent._id] : [],
      documents: buildDocuments(documents),
      createdBy
    });

    if (parent) {
      await dispatchNotification({
        eventType: 'student_admitted',
        schoolId,
        target: parent._id.toString(),
        payload: {
          studentId: student._id,
          name: student.name,
          admissionNumber: student.admissionNumber,
          admissionDate: student.admissionDate,
          classId: student.classId
        },
        createdBy
      });
    }

    res.status(201).json({ student, parent });
  } catch (err) {
    next(err);
  }
}

async function listStudents(req, res, next) {
  try {
    const rows = await Student.find({ schoolId: req.user.schoolId }).sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { createStudent, listStudents };
