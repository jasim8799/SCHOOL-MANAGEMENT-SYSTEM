const TeacherAttendance = require('../models/TeacherAttendance');
const User = require('../models/User');

function parseDateOnly(dateStr) {
  const d = new Date(dateStr);
  // normalize to midnight local
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

module.exports = {
  // POST /api/teacher-attendance/mark
  async markSelf(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const teacherId = req.user.userId;
      const { date, status } = req.body;
      if (!date || !status) return res.status(400).json({ error: 'date and status required' });
      if (!['present','absent','leave'].includes(status)) return res.status(400).json({ error: 'invalid status' });

      const day = parseDateOnly(date);

      const row = await TeacherAttendance.findOneAndUpdate(
        { schoolId, teacherId, date: day },
        { $set: { status, markedAt: new Date() } },
        { upsert: true, new: true }
      );

      res.status(200).json({ success: true, row });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/teacher-attendance/self
  async listSelf(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const teacherId = req.user.userId;
      const rows = await TeacherAttendance.find({ schoolId, teacherId }).sort({ date: -1 }).limit(60);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/teacher-attendance/date/:date
  async listByDate(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const day = parseDateOnly(req.params.date);

      // Get all teachers in school
      const teachers = await User.find({ schoolId, role: 'teacher' }).select('_id name');
      const att = await TeacherAttendance.find({ schoolId, date: day });
      const map = {};
      att.forEach(r => { map[r.teacherId.toString()] = r; });

      const payload = teachers.map(t => ({
        teacherId: t._id,
        teacherName: t.name,
        date: req.params.date,
        status: map[t._id.toString()]?.status || 'not-marked'
      }));

      res.json(payload);
    } catch (err) {
      next(err);
    }
  }
};
