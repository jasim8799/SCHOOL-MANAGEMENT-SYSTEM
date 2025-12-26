const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Video = require('../models/Video');
const MessageLog = require('../models/MessageLog');
const Student = require('../models/Student');
const School = require('../models/School');

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

async function getHomeStats(req, res, next) {
  try {
    const role = req.user.role;
    const schoolId = req.user.schoolId;
    const queryStudentId = req.query.studentId;

    const school = await School.findOne({ $or: [{ _id: schoolId }, { schoolId }] }).select('enabledModules');
    const enabled = (school && Array.isArray(school.enabledModules)) ? school.enabledModules : [];
    const hasFees = enabled.includes('fees');
    const hasVideo = enabled.includes('video');

    // Helper to compute attendance percentage for a student between dates
    const computeAttendancePercent = async (studentId, from, to) => {
      if (!studentId) return null;
      const filter = { schoolId, studentId, date: { $gte: from, $lte: to } };
      const total = await Attendance.countDocuments(filter);
      if (total === 0) return null;
      const present = await Attendance.countDocuments({ ...filter, status: 'present' });
      return Math.round((present / total) * 100);
    };

    // Helper to fetch last result summary
    const lastResult = async (studentId) => {
      if (!studentId) return null;
      const r = await Result.findOne({ schoolId, studentId }).sort({ createdAt: -1 }).lean();
      if (!r) return null;
      return { examId: r.examId, subject: r.subject, marksObtained: r.marksObtained, grade: r.grade, createdAt: r.createdAt };
    };

    if (role === 'student') {
      // Determine studentId
      let studentId = queryStudentId;
      if (!studentId) {
        // Try to find Student with same _id as userId
        const s = await Student.findOne({ $or: [{ _id: req.user.userId }, { _id: queryStudentId }], schoolId }).select('_id');
        if (s) studentId = s._id;
      }

      const attendancePercentage = await computeAttendancePercent(studentId, startOfMonth(), endOfMonth());
      const lastResultSummary = await lastResult(studentId);
      const newVideosCount = hasVideo ? await Video.countDocuments({ schoolId, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }) : 0;
      const noticesCount = 0; // no notices collection available in this codebase

      return res.json({ role: 'student', attendancePercentage, lastResultSummary, newVideosCount, noticesCount });
    }

    if (role === 'parent') {
      // Determine selected child
      let studentId = queryStudentId;
      if (!studentId) {
        const child = await Student.findOne({ parentIds: req.user.userId, schoolId }).select('_id');
        if (child) studentId = child._id;
      }

      const selectedChildAttendancePercentage = await computeAttendancePercent(studentId, startOfMonth(), endOfMonth());
      const pendingFeesAmount = hasFees && studentId ? (await Fee.aggregate([
        { $match: { schoolId: {$eq: schoolId}, studentId: {$eq: studentId}, status: { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, total: { $sum: { $add: ['$amount', { $ifNull: ['$lateFeeAmount', 0] }] } } } }
      ])).map(r => r.total)[0] || 0 : 0;

      const lastResultSummary = await lastResult(studentId);
      const noticesCount = 0;

      return res.json({ role: 'parent', selectedChildAttendancePercentage, pendingFeesAmount, lastResultSummary, noticesCount });
    }

    if (role === 'principal') {
      const totalStudents = await Student.countDocuments({ schoolId });
      // today's attendance across school
      const totalToday = await Attendance.countDocuments({ schoolId, date: { $gte: startOfToday(), $lte: endOfToday() } });
      const presentToday = await Attendance.countDocuments({ schoolId, date: { $gte: startOfToday(), $lte: endOfToday() }, status: 'present' });
      const todayAttendancePercentage = totalToday === 0 ? null : Math.round((presentToday / totalToday) * 100);

      const pendingFeesTotal = hasFees ? (await Fee.aggregate([
        { $match: { schoolId: {$eq: schoolId}, status: { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, total: { $sum: { $add: ['$amount', { $ifNull: ['$lateFeeAmount', 0] }] } } } }
      ])).map(r => r.total)[0] || 0 : 0;

      const monthStart = startOfMonth();
      const monthEnd = endOfMonth();
      const messagesSentThisMonth = await MessageLog.countDocuments({ schoolId, status: 'sent', createdAt: { $gte: monthStart, $lte: monthEnd } });

      return res.json({ role: 'principal', totalStudents, todayAttendancePercentage, pendingFeesTotal, messagesSentThisMonth });
    }

    // default: provide minimal data
    res.json({ role: role, message: 'No stats available for this role' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHomeStats };
