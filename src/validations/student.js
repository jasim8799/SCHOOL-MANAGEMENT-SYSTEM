const Joi = require('joi');

const createStudentSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  admissionNumber: Joi.string().optional(),
  admissionDate: Joi.date().optional(),
  dob: Joi.date().optional(),
  gender: Joi.string().optional(),
  classId: Joi.string().optional(),
  parentIds: Joi.array().items(Joi.string()).optional(),
  parentName: Joi.string().optional(),
  parentEmail: Joi.string().email().optional(),
  parentMobile: Joi.string().pattern(/^(\+91)?[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Parent mobile number must be a valid Indian number',
    'any.required': 'Parent mobile number is required'
  }),
  studentMobile: Joi.string().pattern(/^(\+91)?[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Student mobile number must be a valid Indian number',
    'any.required': 'Student mobile number is required'
  }),
  documents: Joi.array().optional(),
  meta: Joi.object().optional()
});

const updateStudentSchema = createStudentSchema.fork(['name'], (s) => s.optional());

module.exports = { createStudentSchema, updateStudentSchema };
