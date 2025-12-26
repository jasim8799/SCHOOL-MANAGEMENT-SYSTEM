const express = require('express');
const examNoteController = require('../controllers/examNoteController');
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/role');

const router = express.Router();

// POST: Create exam note (teacher, principal, operator)
router.post('/', auth, authorize(['TEACHER', 'PRINCIPAL', 'OPERATOR']), examNoteController.createExamNote);

// GET: List exam notes (all roles, filtered by authorization)
router.get('/', auth, examNoteController.listExamNotes);

// GET: Get specific exam note
router.get('/:id', auth, examNoteController.getExamNote);

// DELETE: Delete exam note (creator or principal/operator)
router.delete('/:id', auth, authorize(['TEACHER', 'PRINCIPAL', 'OPERATOR']), examNoteController.deleteExamNote);

module.exports = router;
