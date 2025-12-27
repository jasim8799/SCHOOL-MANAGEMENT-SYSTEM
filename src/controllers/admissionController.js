const Student = require('../models/Student');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const { hashPassword } = require('../utils/password');
const { dispatchNotification } = require('../services/notificationDispatcher');

function validateMobile(mobile) {
  if (!mobile) return { valid: false, error: 'Mobile number is required' };
  const cleaned = String(mobile).replace(/[\s()-]/g, '');
  const indianMobile = /^(\+91)?[6-9]\d{9}$/.test(cleaned);
  if (!indianMobile) {
    return { valid: false, error: 'Invalid mobile number. Use Indian format: +91XXXXXXXXXX or 10 digits' };
  }
  const normalized = cleaned.startsWith('+91') ? cleaned : `+91${cleaned.replace(/^91/, '')}`;
  return { valid: true, mobile: normalized };
}

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

async function ensureParent({ name, email, mobile, schoolId, createdBy }) {
  if (!email) return null;
  
  // Validate mobile
  const mobileValidation = validateMobile(mobile);
  if (!mobileValidation.valid) {
    throw new Error(`Parent ${mobileValidation.error}`);
  }
  
  const normalizedEmail = email.toLowerCase();
  let parent = await User.findOne({ email: normalizedEmail, schoolId, role: ROLES.PARENT });
  if (parent) {
    // Update mobile if not set
    if (!parent.meta?.mobile) {
      parent.meta = parent.meta || {};
      parent.meta.mobile = mobileValidation.mobile;
      await parent.save();
    }
    return parent;
  }
  
  const passwordHash = await hashPassword('welcome123');
  parent = await User.create({
    schoolId,
    name: name || 'Parent',
    email: normalizedEmail,
    passwordHash,
    role: ROLES.PARENT,
    meta: { mobile: mobileValidation.mobile },
    createdBy
  });
  return parent;
}

async function createStudent(req, res, next) {
  try {
    const { name, admissionNumber, admissionDate, classId, parentName, parentEmail, parentMobile, studentMobile, documents } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!parentMobile) return res.status(400).json({ error: 'Parent mobile number is required' });
    if (!studentMobile) return res.status(400).json({ error: 'Student mobile number is required' });
    
    // Validate student mobile
    const studentMobileValidation = validateMobile(studentMobile);
    if (!studentMobileValidation.valid) {
      return res.status(400).json({ error: `Student ${studentMobileValidation.error}` });
    }
    
    const schoolId = req.user.schoolId;
    const createdBy = req.user.userId;

    const parent = await ensureParent({ name: parentName, email: parentEmail, mobile: parentMobile, schoolId, createdBy });

    const student = await Student.create({
      schoolId,
      name,
      admissionNumber,
      admissionDate: admissionDate ? new Date(admissionDate) : undefined,
      classId,
      parentIds: parent ? [parent._id] : [],
      meta: { mobile: studentMobileValidation.mobile },
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
