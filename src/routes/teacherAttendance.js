const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { ROLES } = require('../config/constants');
const ctrl = require('../controllers/teacherAttendanceController');

router.use(auth);

router.post('/mark', authorize([ROLES.TEACHER]), ctrl.markSelf);
router.get('/self', authorize([ROLES.TEACHER]), ctrl.listSelf);
router.get('/date/:date', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), ctrl.listByDate);

module.exports = router;
