const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const studentController = require('../controllers/studentController');
const { validate } = require('../middlewares/validate');
const { createStudentSchema, updateStudentSchema } = require('../validations/student');
const { ROLES } = require('../config/constants');

router.use(auth);

// All roles except parents/students can manage students; students/parents have read-only of their own
router.post('/', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.TEACHER]), validate(createStudentSchema), studentController.createStudent);
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.TEACHER]), studentController.listStudents);
router.get('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT]), studentController.getStudent);
router.put('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), validate(updateStudentSchema), studentController.updateStudent);
router.delete('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), studentController.deleteStudent);

module.exports = router;
