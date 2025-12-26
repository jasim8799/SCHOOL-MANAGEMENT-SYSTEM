const Joi = require('joi');

const createResultSchema = Joi.object({
  examId: Joi.string().required(),
  studentId: Joi.string().required(),
  subject: Joi.string().optional(),
  marksObtained: Joi.number().optional(),
  maxMarks: Joi.number().optional(),
  grade: Joi.string().optional(),
  remarks: Joi.string().optional()
});

const updateResultSchema = createResultSchema.fork(['marksObtained','grade','remarks'], (s) => s.optional());

module.exports = { createResultSchema, updateResultSchema };
