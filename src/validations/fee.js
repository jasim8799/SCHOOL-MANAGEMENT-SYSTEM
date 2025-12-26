const Joi = require('joi');

const createFeeSchema = Joi.object({
  studentId: Joi.string().required(),
  classId: Joi.string().optional(),
  amount: Joi.number().positive().required(),
  dueDate: Joi.date().optional(),
  lateFeeAmount: Joi.number().min(0).optional(),
  status: Joi.string().valid('pending','paid','partial').optional(),
  paymentMode: Joi.string().valid('cash','online','bank').optional(),
  receiptNumber: Joi.string().optional()
});

const updateFeeSchema = createFeeSchema.fork(['studentId','amount'], (s) => s.optional());

module.exports = { createFeeSchema, updateFeeSchema };
