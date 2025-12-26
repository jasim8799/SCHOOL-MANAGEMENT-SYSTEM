const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { requireModule } = require('../middlewares/moduleToggle');
const feeController = require('../controllers/feeController');
const { ROLES } = require('../config/constants');
const { validate } = require('../middlewares/validate');
const { createFeeSchema, updateFeeSchema } = require('../validations/fee');

router.use(auth);
router.use(requireModule('fees'));

router.post('/', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), validate(createFeeSchema), feeController.createFee);
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.STUDENT, ROLES.PARENT]), feeController.getFees);
router.get('/summary', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), feeController.getFeeSummary);
router.put('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), validate(updateFeeSchema), feeController.updateFee);

module.exports = router;
