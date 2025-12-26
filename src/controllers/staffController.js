const User = require('../models/User');
const ClassModel = require('../models/Class');
const Subject = require('../models/Subject');
const { hashPassword } = require('../utils/password');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { ROLES } = require('../config/constants');

function buildDocuments(docs = []) {
  if (!Array.isArray(docs)) return [];
  return docs
    .filter(Boolean)
    .map((d) => ({ type: d.type || 'document', url: d.url || '', uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : new Date() }))
    .filter((d) => !!d.url);
}

async function createStaff(req, res, next) {
  try {
    const { name, email, password, role, classIds = [], subjectIds = [], documents = [] } = req.body;
    if (!name || !email || !role) return res.status(400).json({ error: 'name, email, role required' });
    if (![ROLES.TEACHER, ROLES.OPERATOR].includes(role)) return res.status(400).json({ error: 'role must be teacher or operator' });

    const schoolId = req.user.schoolId;
    const existing = await User.findOne({ email: email.toLowerCase(), schoolId });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await hashPassword(password || 'welcome123');
    const user = await User.create({
      schoolId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      documents: buildDocuments(documents),
      createdBy: req.user.userId
    });

    if (role === ROLES.TEACHER) {
      if (Array.isArray(classIds) && classIds.length) {
        await ClassModel.updateMany({ _id: { $in: classIds }, schoolId }, { $addToSet: { teacherIds: user._id } });
      }
      if (Array.isArray(subjectIds) && subjectIds.length) {
        await Subject.updateMany({ _id: { $in: subjectIds }, schoolId }, { $addToSet: { teacherIds: user._id } });
      }
    }

    await dispatchNotification({
      eventType: 'staff_created',
      schoolId,
      target: user._id.toString(),
      payload: {
        userId: user._id,
        name: user.name,
        role: user.role,
        classIds,
        subjectIds
      },
      createdBy: req.user.userId
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function listStaff(req, res, next) {
  try {
    const rows = await User.find({ schoolId: req.user.schoolId, role: { $in: [ROLES.TEACHER, ROLES.OPERATOR] } }).sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { createStaff, listStaff };
