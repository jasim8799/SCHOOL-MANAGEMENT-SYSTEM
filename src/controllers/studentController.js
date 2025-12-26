const Student = require('../models/Student');

async function createStudent(req, res, next) {
  try {
    const payload = req.body;
    payload.schoolId = req.user.schoolId;
    payload.createdBy = req.user.userId;
    const s = await Student.create(payload);
    res.status(201).json(s);
  } catch (err) {
    next(err);
  }
}

async function listStudents(req, res, next) {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const filter = { schoolId: req.user.schoolId };
    if (q) filter.name = new RegExp(q, 'i');
    const students = await Student.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    next(err);
  }
}

async function getStudent(req, res, next) {
  try {
    const { id } = req.params;
    const student = await Student.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
}

async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const student = await Student.findOneAndUpdate({ _id: id, schoolId: req.user.schoolId }, { $set: updates, $setOnInsert: { createdBy: req.user.userId } }, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    const student = await Student.findOneAndDelete({ _id: id, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createStudent, listStudents, getStudent, updateStudent, deleteStudent };
