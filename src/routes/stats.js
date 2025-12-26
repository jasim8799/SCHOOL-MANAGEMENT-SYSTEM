const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getHomeStats } = require('../controllers/statsController');

// GET /api/stats/home
router.get('/home', auth, getHomeStats);

module.exports = router;
