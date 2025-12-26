const Exam = require('../models/Exam');
const Student = require('../models/Student');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { ROLES } = require('../config/constants');

function normalizeExamPayload(payload) {
  if (!payload.name && payload.examName) payload.name = payload.examName;
  if (!payload.examName && payload.name) payload.examName = payload.name;
  if (!payload.subjects) payload.subjects = [];
  return payload;
}

async function announceExam(exam, createdBy) {
  const to = exam.classId ? `class:${exam.classId}` : 'school:all';
  try {
    await dispatchNotification({
      eventType: 'exam_schedule_announced',
      schoolId: exam.schoolId,
      target: to,
      payload: {
        examId: exam._id,
        name: exam.examName || exam.name,
        startDate: exam.startDate,
        endDate: exam.endDate,
        classId: exam.classId,
        subjects: exam.subjects || []
      },
      createdBy
    });
  } catch (err) {
    console.error('Exam announcement notification failed', err);
  }
}

async function announceAdmitCard(exam, createdBy) {
  if (!exam.admitCardEnabled) return;
  const to = exam.classId ? `class:${exam.classId}` : 'school:all';
  try {
    await dispatchNotification({
      eventType: 'admit_card_published',
      schoolId: exam.schoolId,
      target: to,
      payload: {
        examId: exam._id,
        name: exam.examName || exam.name,
        classId: exam.classId,
        startDate: exam.startDate,
        endDate: exam.endDate
      },
      createdBy
    });
  } catch (err) {
    console.error('Admit card notification failed', err);
  }
}

async function createExam(req, res, next) {
  try {
    const payload = normalizeExamPayload(req.body);
    payload.schoolId = req.user.schoolId;
    payload.createdBy = req.user.userId;
    const doc = await Exam.create(payload);
    await announceExam(doc, req.user.userId);
    if (doc.admitCardEnabled) await announceAdmitCard(doc, req.user.userId);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

async function listExams(req, res, next) {
  try {
    const filter = { schoolId: req.user.schoolId };
    const role = req.user.role;
    const { classId, studentId } = req.query;

    if (role === ROLES.STUDENT) {
      const student = await Student.findOne({ _id: req.user.userId, schoolId: req.user.schoolId }).select('classId');
      if (!student || !student.classId) return res.json([]);
      filter.classId = student.classId;
    } else if (role === ROLES.PARENT) {
      let targetStudentId = studentId;
      if (targetStudentId) {
        const owns = await Student.exists({ _id: targetStudentId, schoolId: req.user.schoolId, parentIds: req.user.userId });
        if (!owns) return res.status(403).json({ error: 'Not authorized for this student' });
      } else {
        const child = await Student.findOne({ parentIds: req.user.userId, schoolId: req.user.schoolId }).select('_id classId');
        if (!child) return res.json([]);
        targetStudentId = child._id;
        filter.classId = child.classId;
      }
      if (!filter.classId) {
        const child = await Student.findOne({ _id: targetStudentId, schoolId: req.user.schoolId }).select('classId');
        if (!child || !child.classId) return res.json([]);
        filter.classId = child.classId;
      }
    } else {
      if (classId) filter.classId = classId;
    }

    const docs = await Exam.find(filter).sort({ startDate: -1, createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

async function getExam(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Exam.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!doc) return res.status(404).json({ error: 'Exam not found' });

    // Enforce class scoping for student/parent
    if (req.user.role === ROLES.STUDENT) {
      const student = await Student.findOne({ _id: req.user.userId, schoolId: req.user.schoolId }).select('classId');
      if (!student || (doc.classId && String(doc.classId) !== String(student.classId))) return res.status(403).json({ error: 'Not authorized for this exam' });
    }
    if (req.user.role === ROLES.PARENT) {
      const { studentId } = req.query;
      let child = null;
      if (studentId) {
        child = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId, parentIds: req.user.userId }).select('classId');
      } else {
        child = await Student.findOne({ parentIds: req.user.userId, schoolId: req.user.schoolId }).select('classId');
      }
      if (!child || (doc.classId && String(doc.classId) !== String(child.classId))) return res.status(403).json({ error: 'Not authorized for this exam' });
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function updateExam(req, res, next) {
  try {
    const { id } = req.params;
    const updates = normalizeExamPayload(req.body);
    const existing = await Exam.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!existing) return res.status(404).json({ error: 'Exam not found' });

    const prevAdmit = !!existing.admitCardEnabled;
    existing.set(updates);
    const doc = await existing.save();

    await announceExam(doc, req.user.userId);
    if (!prevAdmit && doc.admitCardEnabled) {
      await announceAdmitCard(doc, req.user.userId);
    }

    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function deleteExam(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Exam.findOneAndDelete({ _id: id, schoolId: req.user.schoolId });
    if (!doc) return res.status(404).json({ error: 'Exam not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createExam, listExams, getExam, updateExam, deleteExam };
