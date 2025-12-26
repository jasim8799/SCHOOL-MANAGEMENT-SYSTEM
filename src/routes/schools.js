const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const schoolController = require('../controllers/schoolController');

router.use(auth);

router.get('/:id', schoolController.getSchool);

module.exports = router;
