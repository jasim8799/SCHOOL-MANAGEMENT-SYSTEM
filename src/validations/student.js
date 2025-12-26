const Joi = require('joi');

const createStudentSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  admissionNumber: Joi.string().optional(),
  dob: Joi.date().optional(),
  gender: Joi.string().optional(),
  classId: Joi.string().optional(),
  parentIds: Joi.array().items(Joi.string()).optional(),
  meta: Joi.object().optional()
});

const updateStudentSchema = createStudentSchema.fork(['name'], (s) => s.optional());

module.exports = { createStudentSchema, updateStudentSchema };
