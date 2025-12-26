const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const examController = require('../controllers/examController');
const { ROLES } = require('../config/constants');
const { validate } = require('../middlewares/validate');
const { createExamSchema, updateExamSchema } = require('../validations/exam');

router.use(auth);

router.post('/', authorize([ROLES.PRINCIPAL, ROLES.TEACHER]), validate(createExamSchema), examController.createExam);
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR, ROLES.STUDENT, ROLES.PARENT]), examController.listExams);
router.get('/:id', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR, ROLES.STUDENT, ROLES.PARENT]), examController.getExam);
router.put('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.TEACHER]), validate(updateExamSchema), examController.updateExam);
router.delete('/:id', authorize([ROLES.PRINCIPAL]), examController.deleteExam);

module.exports = router;
