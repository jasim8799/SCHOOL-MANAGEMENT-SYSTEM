const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true },
    sizeBytes: { type: Number },
    visibility: { type: String, enum: ['public', 'private'], default: 'private' },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

VideoSchema.index({ schoolId: 1, title: 1 });

module.exports = mongoose.model('Video', VideoSchema);
