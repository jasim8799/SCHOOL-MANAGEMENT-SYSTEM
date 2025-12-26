const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { ROLES } = require('../config/constants');
const ctrl = require('../controllers/admissionController');

router.use(auth);

router.post('/student', authorize([ROLES.OPERATOR]), ctrl.createStudent);
router.get('/students', authorize([ROLES.OPERATOR, ROLES.PRINCIPAL]), ctrl.listStudents);

module.exports = router;
