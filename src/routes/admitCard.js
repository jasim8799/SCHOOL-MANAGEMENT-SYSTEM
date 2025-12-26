const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getAdmitCard } = require('../controllers/admitCardController');

router.use(auth);

// GET /api/admit-card/:examId/:studentId
router.get('/:examId/:studentId', getAdmitCard);

module.exports = router;
