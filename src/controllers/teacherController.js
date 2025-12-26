const User = require('../models/User');
const { hashPassword } = require('../utils/password');

async function createTeacher(req, res, next) {
  try {
    const { name, email, password, meta } = req.body;
    const passwordHash = await hashPassword(password || 'changeme');
    const payload = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'teacher',
      schoolId: req.user.schoolId,
      createdBy: req.user.userId,
      meta
    };
    const user = await User.create(payload);
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
}

async function listTeachers(req, res, next) {
  try {
    const teachers = await User.find({ schoolId: req.user.schoolId, role: 'teacher' }).select('-passwordHash');
    res.json(teachers);
  } catch (err) {
    next(err);
  }
}

async function getTeacher(req, res, next) {
  try {
    const { id } = req.params;
    const teacher = await User.findOne({ _id: id, schoolId: req.user.schoolId, role: 'teacher' }).select('-passwordHash');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    next(err);
  }
}

async function updateTeacher(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.passwordHash;
    const teacher = await User.findOneAndUpdate({ _id: id, schoolId: req.user.schoolId, role: 'teacher' }, { $set: updates }, { new: true }).select('-passwordHash');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    next(err);
  }
}

async function deleteTeacher(req, res, next) {
  try {
    const { id } = req.params;
    const teacher = await User.findOneAndDelete({ _id: id, schoolId: req.user.schoolId, role: 'teacher' });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTeacher, listTeachers, getTeacher, updateTeacher, deleteTeacher };
