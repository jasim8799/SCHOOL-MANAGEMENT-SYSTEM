const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    classIds: [{ type: mongoose.Types.ObjectId, ref: 'Class' }],
    teacherIds: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    meta: { type: Object },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

SubjectSchema.index({ schoolId: 1, name: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);
