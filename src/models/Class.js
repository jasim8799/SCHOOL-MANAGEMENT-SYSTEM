const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, index: true },
    section: { type: String },
    teacherIds: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    meta: { type: Object },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ClassSchema.index({ schoolId: 1, name: 1, section: 1 });

module.exports = mongoose.model('Class', ClassSchema);
