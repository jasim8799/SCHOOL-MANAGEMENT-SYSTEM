const ExamNote = require('../models/ExamNote');
const Class = require('../models/Class');
const User = require('../models/User');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { createExamNote: validateExamNote } = require('../validations/examNote');

const examNoteController = {
  async createExamNote(req, res) {
    try {
      const { error, value } = validateExamNote.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { title, description, examId, subjectId, classId, attachmentUrl } = value;
      const schoolId = req.schoolId;
      const userId = req.userId;
      const userRole = req.userRole;

      // Verify class exists and belongs to school
      const cls = await Class.findOne({ _id: classId, schoolId });
      if (!cls) return res.status(404).json({ error: 'Class not found' });

      // Authorization: teacher can only upload for assigned classes
      if (userRole === 'TEACHER') {
        const teacher = await User.findById(userId);
        if (!teacher || !teacher.assignedClasses?.includes(classId)) {
          return res.status(403).json({ error: 'Not authorized for this class' });
        }
      } else if (userRole !== 'PRINCIPAL' && userRole !== 'OPERATOR') {
        return res.status(403).json({ error: 'Only teachers and principals can upload notes' });
      }

      const note = new ExamNote({
        title,
        description,
        examId,
        subjectId,
        classId,
        attachmentUrl,
        createdBy: userId,
        schoolId,
        publishedAt: new Date()
      });

      await note.save();

      // Send notifications to students and parents of this class
      const students = await User.find({ classId, schoolId, role: 'STUDENT' });
      const studentIds = students.map(s => s._id.toString());
      const parentIds = await User.distinct('_id', { classId, schoolId, role: 'PARENT' });

      const notificationTargets = [...studentIds, ...parentIds];
      const notificationPayload = {
        title: `New Exam Notes: ${title}`,
        message: `${title} has been published for your class.`,
        data: { examNoteId: note._id.toString(), examId, classId }
      };

      await dispatchNotification({
        eventType: 'exam_notes_published',
        schoolId,
        target: notificationTargets,
        payload: notificationPayload,
        createdBy: userId
      });

      res.status(201).json(note);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async listExamNotes(req, res) {
    try {
      const schoolId = req.schoolId;
      const userId = req.userId;
      const userRole = req.userRole;
      const { examId, subjectId, classId } = req.query;

      let filter = { schoolId };

      // Student: see only notes for their class
      if (userRole === 'STUDENT') {
        const student = await User.findById(userId);
        if (!student || !student.classId) return res.status(400).json({ error: 'Student class not found' });
        filter.classId = student.classId;
      }
      // Parent: see only notes for their child's class
      else if (userRole === 'PARENT') {
        const parent = await User.findById(userId);
        if (!parent || !parent.childrenIds?.length) return res.status(200).json([]);
        const children = await User.find({ _id: { $in: parent.childrenIds }, schoolId });
        const classIds = [...new Set(children.map(c => c.classId?.toString()).filter(Boolean))];
        filter.$or = [{ classId: { $in: classIds } }];
      }
      // Teacher: see only notes for their assigned classes
      else if (userRole === 'TEACHER') {
        const teacher = await User.findById(userId);
        if (!teacher || !teacher.assignedClasses?.length) return res.status(200).json([]);
        filter.classId = { $in: teacher.assignedClasses };
      }
      // Principal/Operator: see all notes for school

      // Apply optional filters
      if (examId) filter.examId = examId;
      if (subjectId) filter.subjectId = subjectId;
      if (classId && (userRole === 'PRINCIPAL' || userRole === 'OPERATOR')) {
        filter.classId = classId;
      }

      const notes = await ExamNote.find(filter)
        .populate('examId', 'name')
        .populate('subjectId', 'name')
        .populate('classId', 'name section')
        .sort({ publishedAt: -1 });

      res.status(200).json(notes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getExamNote(req, res) {
    try {
      const schoolId = req.schoolId;
      const userId = req.userId;
      const userRole = req.userRole;
      const { id } = req.params;

      const note = await ExamNote.findOne({ _id: id, schoolId })
        .populate('examId')
        .populate('subjectId')
        .populate('classId');

      if (!note) return res.status(404).json({ error: 'Note not found' });

      // Authorization: user must be in the class or be principal/operator
      if (userRole !== 'PRINCIPAL' && userRole !== 'OPERATOR') {
        const user = await User.findById(userId);
        let authorized = false;

        if (userRole === 'STUDENT' && user?.classId?.toString() === note.classId._id.toString()) {
          authorized = true;
        } else if (userRole === 'PARENT' && user?.childrenIds?.length) {
          const childClassIds = await User.distinct('classId', { _id: { $in: user.childrenIds } });
          authorized = childClassIds.some(cid => cid?.toString() === note.classId._id.toString());
        } else if (userRole === 'TEACHER' && user?.assignedClasses?.includes(note.classId._id.toString())) {
          authorized = true;
        }

        if (!authorized) return res.status(403).json({ error: 'Not authorized' });
      }

      res.status(200).json(note);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteExamNote(req, res) {
    try {
      const schoolId = req.schoolId;
      const userId = req.userId;
      const userRole = req.userRole;
      const { id } = req.params;

      const note = await ExamNote.findOne({ _id: id, schoolId });
      if (!note) return res.status(404).json({ error: 'Note not found' });

      // Only creator (teacher/principal) or principal/operator can delete
      if (userRole !== 'PRINCIPAL' && userRole !== 'OPERATOR' && note.createdBy !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete' });
      }

      await ExamNote.deleteOne({ _id: id });
      res.status(200).json({ message: 'Note deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = examNoteController;
