const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const Class = require('../models/Class');
const { ROLES } = require('../config/constants');

router.use(auth);

// List classes for the school
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT]), async (req, res, next) => {
  try {
    const rows = await Class.find({ schoolId: req.user.schoolId }).sort({ name: 1, section: 1 });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
