const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const Subject = require('../models/Subject');
const { ROLES } = require('../config/constants');

router.use(auth);

// List subjects for the school (used by dashboards/forms)
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR, ROLES.STUDENT, ROLES.PARENT]), async (req, res, next) => {
  try {
    const rows = await Subject.find({ schoolId: req.user.schoolId }).sort({ name: 1 });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// List subjects assigned to current teacher (optionally by class)
router.get('/assigned', authorize([ROLES.TEACHER]), async (req, res, next) => {
  try {
    const { classId } = req.query;
    const filter = { schoolId: req.user.schoolId, teacherIds: req.user.userId };
    if (classId) filter.$or = [{ classIds: { $in: [classId] } }, { classIds: { $exists: false } }];
    const rows = await Subject.find(filter).sort({ name: 1 });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
