const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const teacherController = require('../controllers/teacherController');
const { ROLES } = require('../config/constants');
const { validate } = require('../middlewares/validate');
const { createTeacherSchema, updateTeacherSchema } = require('../validations/teacher');

router.use(auth);

router.post('/', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), validate(createTeacherSchema), teacherController.createTeacher);
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.TEACHER]), teacherController.listTeachers);
router.get('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.TEACHER]), teacherController.getTeacher);
router.put('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), validate(updateTeacherSchema), teacherController.updateTeacher);
router.delete('/:id', authorize([ROLES.PRINCIPAL]), teacherController.deleteTeacher);

module.exports = router;
