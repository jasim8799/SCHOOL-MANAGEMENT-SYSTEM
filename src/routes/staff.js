const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { ROLES } = require('../config/constants');
const ctrl = require('../controllers/staffController');

router.use(auth);

router.post('/', authorize([ROLES.PRINCIPAL]), ctrl.createStaff);
router.get('/', authorize([ROLES.PRINCIPAL]), ctrl.listStaff);

module.exports = router;
