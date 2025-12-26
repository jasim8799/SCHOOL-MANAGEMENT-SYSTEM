const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const studentRoutes = require('./students');
const teacherRoutes = require('./teachers');
const attendanceRoutes = require('./attendance');
const examRoutes = require('./exams');
const resultRoutes = require('./results');
const feeRoutes = require('./fees');
const messageRoutes = require('./messages');
const adminRoutes = require('./admin');
const statsRoutes = require('./stats');
const admitCardRoutes = require('./admitCard');
const announcementRoutes = require('./announcements');
const examNoteRoutes = require('./examNotes');
const subjectRoutes = require('./subjects');
const admissionRoutes = require('./admissions');
const staffRoutes = require('./staff');

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/exams', examRoutes);
router.use('/results', resultRoutes);
router.use('/fees', feeRoutes);
router.use('/messages', messageRoutes);
const videoRoutes = require('./videos');
const schoolRoutes = require('./schools');
const classRoutes = require('./classes');
const teacherAttendanceRoutes = require('./teacherAttendance');

router.use('/videos', videoRoutes);
router.use('/schools', schoolRoutes);
router.use('/classes', classRoutes);
router.use('/teacher-attendance', teacherAttendanceRoutes);
router.use('/stats', statsRoutes);
router.use('/admin', adminRoutes);
router.use('/admit-card', admitCardRoutes);
router.use('/announcements', announcementRoutes);
router.use('/exam-notes', examNoteRoutes);
router.use('/subjects', subjectRoutes);
router.use('/admissions', admissionRoutes);
router.use('/staff', staffRoutes);

module.exports = router;
