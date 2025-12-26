const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const resultController = require('../controllers/resultController');
const { ROLES } = require('../config/constants');
const { validate } = require('../middlewares/validate');
const { createResultSchema, updateResultSchema } = require('../validations/result');

router.use(auth);

router.post('/', authorize([ROLES.PRINCIPAL, ROLES.TEACHER]), validate(createResultSchema), resultController.createResult);
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR, ROLES.PARENT, ROLES.STUDENT]), resultController.listResults);
router.get('/:id', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR, ROLES.PARENT, ROLES.STUDENT]), resultController.getResult);
router.put('/:id', authorize([ROLES.PRINCIPAL, ROLES.TEACHER]), validate(updateResultSchema), resultController.updateResult);
router.delete('/:id', authorize([ROLES.PRINCIPAL]), resultController.deleteResult);

module.exports = router;
