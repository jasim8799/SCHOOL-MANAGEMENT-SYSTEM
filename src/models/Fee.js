const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    studentId: { type: mongoose.Types.ObjectId, ref: 'Student', required: true, index: true },
    classId: { type: mongoose.Types.ObjectId, ref: 'Class', index: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    lateFeeAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending', index: true },
    paymentMode: { type: String, enum: ['cash', 'online', 'bank'], default: 'cash' },
    receiptNumber: { type: String, index: true },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

FeeSchema.index({ schoolId: 1, classId: 1 });
FeeSchema.index({ schoolId: 1, status: 1 });

module.exports = mongoose.model('Fee', FeeSchema);
