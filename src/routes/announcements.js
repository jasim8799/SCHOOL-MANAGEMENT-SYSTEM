const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const announcementController = require('../controllers/announcementController');
const { ROLES } = require('../config/constants');
const { validate } = require('../middlewares/validate');
const { createAnnouncementSchema, updateAnnouncementSchema } = require('../validations/announcement');

router.use(auth);

router.post('/', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR]), validate(createAnnouncementSchema), announcementController.createAnnouncement);
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT]), announcementController.listAnnouncements);
router.get('/:id', authorize([ROLES.PRINCIPAL, ROLES.OPERATOR, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT]), announcementController.getAnnouncement);
router.delete('/:id', authorize([ROLES.PRINCIPAL]), announcementController.deleteAnnouncement);

module.exports = router;
