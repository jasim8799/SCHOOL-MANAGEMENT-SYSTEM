const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Bootstrap route: enabled only when ADMIN_BOOTSTRAP_SECRET is set in env
router.post('/bootstrap', adminController.bootstrap);

module.exports = router;
