const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const TeacherAttendance = require('../models/TeacherAttendance');
const User = require('../models/User');

async function createAttendance(req, res, next) {
  try {
    const payload = req.body;
    payload.schoolId = req.user.schoolId;
    payload.createdBy = req.user.userId;
    const rec = await Attendance.create(payload);
    res.status(201).json(rec);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/classes - returns classes assigned to logged-in teacher
// GET /api/attendance/classes - classes + subjects assigned to teacher
async function getTeacherClasses(req, res, next) {
  try {
    const classes = await Class.find({ schoolId: req.user.schoolId, teacherIds: req.user.userId });
    const classIds = classes.map(c => c._id);
    const subjects = await Subject.find({ schoolId: req.user.schoolId, teacherIds: req.user.userId, $or: [{ classIds: { $in: classIds } }, { classIds: { $exists: false } }] }).sort({ name: 1 });
    const subjectsByClass = {};
    for (const c of classes) subjectsByClass[c._id.toString()] = [];
    for (const s of subjects) {
      if (!s.classIds || s.classIds.length === 0) {
        // if subject not tied to class, make it selectable for all assigned classes
        for (const c of classes) subjectsByClass[c._id.toString()].push({ _id: s._id, name: s.name });
      } else {
        for (const cid of s.classIds) {
          const key = cid.toString();
          if (subjectsByClass[key]) subjectsByClass[key].push({ _id: s._id, name: s.name });
        }
      }
    }

    const payload = classes.map(c => ({
      _id: c._id,
      name: c.name,
      section: c.section,
      subjects: subjectsByClass[c._id.toString()] || []
    }));

    res.json(payload);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/periods - today's assigned periods for current teacher
async function getTeacherPeriods(req, res, next) {
  try {
    const schoolId = req.user.schoolId;
    const teacherId = req.user.userId;
    const dow = new Date().getDay();
    const rows = await Timetable.find({ schoolId, teacherId, dayOfWeek: dow })
      .populate('classId', 'name section')
      .populate('subjectId', 'name')
      .sort({ period: 1 });
    const payload = rows.map(r => ({
      classId: r.classId._id,
      className: r.classId.name,
      subjectId: r.subjectId._id,
      subjectName: r.subjectId.name,
      period: r.period
    }));
    res.json(payload);
  } catch (err) { next(err); }
}

// GET /api/attendance/class/:classId/date/:date - returns student list with status
// GET /api/attendance/class/:classId/date/:date (legacy)
async function getClassAttendanceByDate(req, res, next) {
  try {
    const { classId, date } = req.params;
    const attendanceDate = new Date(date);
    
    // Verify teacher is assigned to this class
    const cls = await Class.findOne({ _id: classId, schoolId: req.user.schoolId, teacherIds: req.user.userId });
    if (!cls) return res.status(404).json({ error: 'Class not found or not assigned to you' });

    // Get all students in this class
    const students = await Student.find({ classId, schoolId: req.user.schoolId }).select('_id name admissionNumber');
    
    // Get attendance records for this class on this date
    const attendanceRecords = await Attendance.find({ 
      classId, 
      date: attendanceDate, 
      schoolId: req.user.schoolId 
    });
    
    const attendanceMap = {};
    attendanceRecords.forEach(r => {
      attendanceMap[r.studentId.toString()] = r.status;
    });

    const result = students.map(s => ({
      studentId: s._id,
      name: s.name,
      admissionNumber: s.admissionNumber,
      status: attendanceMap[s._id.toString()] || null
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/class/:classId/subject/:subjectId/date/:date - subject-wise status
async function getClassSubjectAttendanceByDate(req, res, next) {
  try {
    const { classId, subjectId, date } = req.params;
    const attendanceDate = new Date(date);

    // Verify teacher is assigned to this class
    const cls = await Class.findOne({ _id: classId, schoolId: req.user.schoolId, teacherIds: req.user.userId });
    if (!cls) return res.status(404).json({ error: 'Class not found or not assigned to you' });

    // Verify subject is assigned to this teacher (and class if specified)
    const subj = await Subject.findOne({ _id: subjectId, schoolId: req.user.schoolId, teacherIds: req.user.userId });
    if (!subj) return res.status(404).json({ error: 'Subject not assigned to you' });
    if (subj.classIds && subj.classIds.length > 0 && !subj.classIds.map(id => id.toString()).includes(classId)) {
      return res.status(403).json({ error: 'Subject not assigned to this class' });
    }

    // Get all students in this class
    const students = await Student.find({ classId, schoolId: req.user.schoolId }).select('_id name admissionNumber');

    // Get attendance records for this class, subject on this date
    const attendanceRecords = await Attendance.find({ classId, subjectId, date: attendanceDate, schoolId: req.user.schoolId });

    const attendanceMap = {};
    attendanceRecords.forEach(r => {
      attendanceMap[r.studentId.toString()] = r.status;
    });

    const result = students.map(s => ({
      studentId: s._id,
      name: s.name,
      admissionNumber: s.admissionNumber,
      status: attendanceMap[s._id.toString()] || null
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/class/:classId/subject/:subjectId/period/:period/date/:date - period-wise status
async function getClassSubjectAttendanceByPeriod(req, res, next) {
  try {
    const { classId, subjectId, period, date } = req.params;
    const attendanceDate = new Date(date);

    // Verify teacher assignment
    const cls = await Class.findOne({ _id: classId, schoolId: req.user.schoolId, teacherIds: req.user.userId });
    if (!cls) return res.status(404).json({ error: 'Class not found or not assigned to you' });
    const subj = await Subject.findOne({ _id: subjectId, schoolId: req.user.schoolId, teacherIds: req.user.userId });
    if (!subj) return res.status(404).json({ error: 'Subject not assigned to you' });

    // Students
    const students = await Student.find({ classId, schoolId: req.user.schoolId }).select('_id name admissionNumber');
    const attendanceRecords = await Attendance.find({ classId, subjectId, period, date: attendanceDate, schoolId: req.user.schoolId });
    const attendanceMap = {};
    attendanceRecords.forEach(r => { attendanceMap[r.studentId.toString()] = r.status; });
    const result = students.map(s => ({
      studentId: s._id,
      name: s.name,
      admissionNumber: s.admissionNumber,
      status: attendanceMap[s._id.toString()] || null
    }));
    res.json(result);
  } catch (err) { next(err); }
}
// POST /api/attendance/mark - batch mark attendance (idempotent)
// POST /api/attendance/mark - idempotent subject-wise period marking
async function markAttendance(req, res, next) {
  try {
    const { classId, subjectId, period, date, records } = req.body;
    if (!classId || !subjectId || !period || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'classId, subjectId, period, date, and records array required' });
    }

    const attendanceDate = new Date(date);

    // Verify teacher is assigned to this class
    const cls = await Class.findOne({ _id: classId, schoolId: req.user.schoolId, teacherIds: req.user.userId });
    if (!cls) return res.status(403).json({ error: 'Class not found or not assigned to you' });

    // Verify subject assignment
    const subj = await Subject.findOne({ _id: subjectId, schoolId: req.user.schoolId, teacherIds: req.user.userId });
    if (!subj) return res.status(403).json({ error: 'Subject not assigned to you' });
    if (subj.classIds && subj.classIds.length > 0 && !subj.classIds.map(id => id.toString()).includes(classId)) {
      return res.status(403).json({ error: 'Subject not assigned to this class' });
    }

    // Block if teacher absent/leave on this day
    const ta = await TeacherAttendance.findOne({ schoolId: req.user.schoolId, teacherId: req.user.userId, date: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate()) });
    if (ta && ta.status !== 'present') {
      return res.status(403).json({ error: 'Teacher absent/leave; cannot mark attendance for this day' });
    }

    // Upsert each record (idempotent, period-aware)
    const results = [];
    for (const rec of records) {
      const updated = await Attendance.findOneAndUpdate(
        { schoolId: req.user.schoolId, studentId: rec.studentId, classId, subjectId, date: attendanceDate, period },
        { $set: { status: rec.status, createdBy: req.user.userId, teacherId: req.user.userId, period } },
        { upsert: true, new: true }
      );
      results.push(updated);
    }

    res.json({ success: true, marked: results.length, records: results });
  } catch (err) {
    next(err);
  }
}

// Read-only status (subject) for principal/operator: subject + teacher + taken/not
async function getAttendanceStatusByClassDate(req, res, next) {
  try {
    const { classId, date } = req.params;
    const attendanceDate = new Date(date);

    const subjects = await Subject.find({ schoolId: req.user.schoolId, $or: [{ classIds: { $in: [classId] } }, { classIds: { $exists: false } }] }).sort({ name: 1 });

    const statusRows = [];
    for (const subj of subjects) {
      const rec = await Attendance.findOne({ schoolId: req.user.schoolId, classId, subjectId: subj._id, date: attendanceDate });
      let taken = !!rec;
      let teacherName = null;
      if (rec && rec.teacherId) {
        const t = await User.findOne({ _id: rec.teacherId });
        teacherName = t?.name || null;
      }
      statusRows.push({ subjectId: subj._id, subject: subj.name, date, status: taken ? 'Taken' : 'Not Taken', teacherName });
    }

    res.json(statusRows);
  } catch (err) {
    next(err);
  }
}

// Period-wise status for principal/operator
async function getPeriodStatusByClassDate(req, res, next) {
  try {
    const { classId, date } = req.params;
    const attendanceDate = new Date(date);
    const dow = new Date(date).getDay();

    const periods = await Timetable.find({ schoolId: req.user.schoolId, classId, dayOfWeek: dow })
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .sort({ period: 1 });

    const ta = await TeacherAttendance.findOne({ schoolId: req.user.schoolId, teacherId: { $in: periods.map(p => p.teacherId) }, date: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate()) });

    const result = [];
    for (const p of periods) {
      let status = 'Not Taken';
      // If teacher absent/leave, mark as Teacher Absent
      const teacherDayStatus = await TeacherAttendance.findOne({ schoolId: req.user.schoolId, teacherId: p.teacherId._id, date: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate()) });
      if (teacherDayStatus && teacherDayStatus.status !== 'present') {
        status = 'Teacher Absent';
      } else {
        const anyRecord = await Attendance.findOne({ schoolId: req.user.schoolId, classId, subjectId: p.subjectId._id, period: p.period, date: attendanceDate });
        if (anyRecord) status = 'Taken';
      }
      result.push({
        period: p.period,
        subject: p.subjectId.name,
        teacher: p.teacherId.name,
        classId,
        date,
        status
      });
    }

    res.json(result);
  } catch (err) { next(err); }
}
// Subject-wise summary for a student (percentages)
async function getSubjectSummaryForStudent(req, res, next) {
  try {
    let { studentId } = req.params;
    const schoolId = req.user.schoolId;
    if (!studentId || studentId === 'self') studentId = req.user.userId;
    const filter = { schoolId, studentId };
    const rows = await Attendance.find(filter);

    const totals = {};
    for (const r of rows) {
      const key = r.subjectId ? r.subjectId.toString() : 'unknown';
      if (!totals[key]) totals[key] = { subjectId: r.subjectId, present: 0, total: 0 };
      totals[key].total += 1;
      if (r.status === 'present') totals[key].present += 1;
    }

    const subjectMap = {};
    const subjectIds = Object.values(totals).map(t => t.subjectId).filter(Boolean);
    const subjects = await Subject.find({ _id: { $in: subjectIds } });
    for (const s of subjects) subjectMap[s._id.toString()] = s.name;

    const result = Object.values(totals).map(t => ({
      subjectId: t.subjectId,
      subject: t.subjectId ? subjectMap[t.subjectId.toString()] || 'Subject' : 'Subject',
      present: t.present,
      total: t.total,
      percentage: t.total > 0 ? Math.round((t.present * 100) / t.total) : 0
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listAttendance(req, res, next) {
  try {
    const { studentId, date } = req.query;
    const filter = { schoolId: req.user.schoolId };
    if (studentId) filter.studentId = studentId;
    if (date) filter.date = new Date(date);
    const rows = await Attendance.find(filter).sort({ date: -1 });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const row = await Attendance.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!row) return res.status(404).json({ error: 'Attendance record not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function updateAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const row = await Attendance.findOneAndUpdate({ _id: id, schoolId: req.user.schoolId }, { $set: updates }, { new: true });
    if (!row) return res.status(404).json({ error: 'Attendance record not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function deleteAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const row = await Attendance.findOneAndDelete({ _id: id, schoolId: req.user.schoolId });
    if (!row) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createAttendance, listAttendance, getAttendance, updateAttendance, deleteAttendance, getTeacherClasses, getTeacherPeriods, getClassAttendanceByDate, getClassSubjectAttendanceByDate, getClassSubjectAttendanceByPeriod, markAttendance, getAttendanceStatusByClassDate, getPeriodStatusByClassDate, getSubjectSummaryForStudent };
