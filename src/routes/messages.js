const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { requireModule } = require('../middlewares/moduleToggle');
const messageController = require('../controllers/messageController');
const { validate } = require('../middlewares/validate');
const { sendMessageSchema } = require('../validations/message');
const { ROLES } = require('../config/constants');

router.use(auth);
router.use(requireModule('whatsapp_sms'));

router.post('/send', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), validate(sendMessageSchema), messageController.send);
router.get('/logs', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), messageController.listLogs);

module.exports = router;
