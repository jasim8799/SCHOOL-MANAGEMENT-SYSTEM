const Announcement = require('../models/Announcement');
const Student = require('../models/Student');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { ROLES } = require('../config/constants');

async function announceCreation(announcement, createdBy) {
  const to = announcement.target === 'class' && announcement.classId ? `class:${announcement.classId}` : 'school:all';
  try {
    await dispatchNotification({
      eventType: 'announcement_published',
      schoolId: announcement.schoolId,
      target: to,
      payload: {
        announcementId: announcement._id,
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        publishedAt: announcement.publishedAt
      },
      createdBy
    });
  } catch (err) {
    console.error('Announcement notification failed', err);
  }
}

async function createAnnouncement(req, res, next) {
  try {
    const payload = req.body;
    payload.schoolId = req.user.schoolId;
    payload.createdBy = req.user.userId;
    if (!payload.publishedAt) payload.publishedAt = new Date();

    const doc = await Announcement.create(payload);
    await announceCreation(doc, req.user.userId);

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

async function listAnnouncements(req, res, next) {
  try {
    const filter = { schoolId: req.user.schoolId };
    const role = req.user.role;
    const { classId, studentId } = req.query;

    if (role === ROLES.STUDENT) {
      const student = await Student.findOne({ _id: req.user.userId, schoolId: req.user.schoolId }).select('classId');
      if (!student || !student.classId) return res.json([]);
      filter.$or = [
        { target: 'school' },
        { target: 'class', classId: student.classId }
      ];
    } else if (role === ROLES.PARENT) {
      let targetStudentId = studentId;
      if (targetStudentId) {
        const owns = await Student.exists({ _id: targetStudentId, schoolId: req.user.schoolId, parentIds: req.user.userId });
        if (!owns) return res.status(403).json({ error: 'Not authorized for this student' });
      } else {
        const child = await Student.findOne({ parentIds: req.user.userId, schoolId: req.user.schoolId }).select('_id classId');
        if (!child) return res.json([]);
        targetStudentId = child._id;
      }

      const targetChild = await Student.findOne({ _id: targetStudentId, schoolId: req.user.schoolId }).select('classId');
      if (!targetChild) return res.json([]);

      filter.$or = [
        { target: 'school' },
        { target: 'class', classId: targetChild.classId }
      ];
    } else {
      if (classId) filter.classId = classId;
    }

    const docs = await Announcement.find(filter).sort({ publishedAt: -1, createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

async function getAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Announcement.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!doc) return res.status(404).json({ error: 'Announcement not found' });

    const role = req.user.role;
    if (role === ROLES.STUDENT) {
      const student = await Student.findOne({ _id: req.user.userId, schoolId: req.user.schoolId }).select('classId');
      if (!student) return res.status(404).json({ error: 'Student not found' });
      if (doc.target === 'class' && String(doc.classId) !== String(student.classId)) {
        return res.status(403).json({ error: 'Not authorized for this announcement' });
      }
    } else if (role === ROLES.PARENT) {
      const { studentId } = req.query;
      let child = null;
      if (studentId) {
        child = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId, parentIds: req.user.userId }).select('classId');
      } else {
        child = await Student.findOne({ parentIds: req.user.userId, schoolId: req.user.schoolId }).select('classId');
      }
      if (!child) return res.status(404).json({ error: 'Child not found' });
      if (doc.target === 'class' && String(doc.classId) !== String(child.classId)) {
        return res.status(403).json({ error: 'Not authorized for this announcement' });
      }
    }

    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Announcement.findOneAndDelete({ _id: id, schoolId: req.user.schoolId });
    if (!doc) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createAnnouncement, listAnnouncements, getAnnouncement, deleteAnnouncement };
