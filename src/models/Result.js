const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    examId: { type: mongoose.Types.ObjectId, ref: 'Exam', required: true, index: true },
    studentId: { type: mongoose.Types.ObjectId, ref: 'Student', required: true, index: true },
    subject: { type: String },
    marksObtained: { type: Number },
    maxMarks: { type: Number },
    grade: { type: String },
    remarks: { type: String },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ResultSchema.index({ schoolId: 1, examId: 1, studentId: 1 });

module.exports = mongoose.model('Result', ResultSchema);
