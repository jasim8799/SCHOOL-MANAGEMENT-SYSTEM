const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, index: true },
    admissionNumber: { type: String, index: true },
    admissionDate: { type: Date },
    documents: [{ type: { type: String }, url: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
    dob: { type: Date },
    gender: { type: String },
    classId: { type: mongoose.Types.ObjectId, ref: 'Class' },
    parentIds: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    meta: { type: Object },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

StudentSchema.index({ schoolId: 1, admissionNumber: 1 });

module.exports = mongoose.model('Student', StudentSchema);
