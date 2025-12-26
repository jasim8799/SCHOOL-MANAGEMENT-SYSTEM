const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');
const { requireModule } = require('../middlewares/moduleToggle');
const videoController = require('../controllers/videoController');
const { ROLES } = require('../config/constants');

router.use(auth);
router.use(requireModule('video'));

router.post('/', authorize([ROLES.PRINCIPAL, ROLES.TEACHER]), videoController.createVideo);
router.get('/', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR, ROLES.STUDENT, ROLES.PARENT]), videoController.listVideos);
router.get('/:id', authorize([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.OPERATOR, ROLES.STUDENT, ROLES.PARENT]), videoController.getVideo);
router.put('/:id', authorize([ROLES.PRINCIPAL, ROLES.TEACHER]), videoController.updateVideo);
router.delete('/:id', authorize([ROLES.PRINCIPAL, ROLES.TEACHER]), videoController.deleteVideo);

module.exports = router;
