const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const attendanceController = require('../controllers/attendanceController');
const { ROLES } = require('../config/constants');
const { validate } = require('../middlewares/validate');
const { createAttendanceSchema, updateAttendanceSchema } = require('../validations/attendance');

router.use(auth);

router.post('/', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR]), validate(createAttendanceSchema), attendanceController.createAttendance);
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR]), attendanceController.listAttendance);
router.get('/classes', authorize([ROLES.TEACHER]), attendanceController.getTeacherClasses);
router.get('/periods', authorize([ROLES.TEACHER]), attendanceController.getTeacherPeriods);
router.get('/class/:classId/date/:date', authorize([ROLES.TEACHER]), attendanceController.getClassAttendanceByDate);
router.get('/class/:classId/subject/:subjectId/date/:date', authorize([ROLES.TEACHER]), attendanceController.getClassSubjectAttendanceByDate);
router.get('/class/:classId/subject/:subjectId/period/:period/date/:date', authorize([ROLES.TEACHER]), attendanceController.getClassSubjectAttendanceByPeriod);
router.post('/mark', authorize([ROLES.TEACHER]), attendanceController.markAttendance);
router.get('/status/class/:classId/date/:date', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), attendanceController.getAttendanceStatusByClassDate);
router.get('/status/class/:classId/date/:date/periods', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), attendanceController.getPeriodStatusByClassDate);
router.get('/summary/student/:studentId', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.STUDENT, ROLES.PARENT]), attendanceController.getSubjectSummaryForStudent);
router.get('/:id', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR, ROLES.STUDENT, ROLES.PARENT]), attendanceController.getAttendance);
router.put('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), validate(updateAttendanceSchema), attendanceController.updateAttendance);
router.delete('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), attendanceController.deleteAttendance);

module.exports = router;
