const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Bootstrap route: enabled only when ADMIN_BOOTSTRAP_SECRET is set in env
router.post('/bootstrap', adminController.bootstrap);

// Admin-only route to set user mobile number (temporary)
router.put('/set-mobile', adminController.setMobile);

module.exports = router;
