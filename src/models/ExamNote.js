const mongoose = require('mongoose');

const examNoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  attachmentUrl: { type: String },
  createdBy: { type: String, required: true }, // userId of teacher/principal
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  publishedAt: { type: Date, default: Date.now }
}, { timestamps: true });

examNoteSchema.index({ examId: 1, classId: 1, schoolId: 1 });
examNoteSchema.index({ subjectId: 1, schoolId: 1 });

module.exports = mongoose.model('ExamNote', examNoteSchema);
