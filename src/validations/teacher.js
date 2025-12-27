const Joi = require('joi');

const createTeacherSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).optional(),
  mobile: Joi.string().pattern(/^(\+91)?[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Mobile number must be a valid Indian number',
    'any.required': 'Mobile number is required'
  }),
  role: Joi.string().optional(),
  classIds: Joi.array().optional(),
  subjectIds: Joi.array().optional(),
  documents: Joi.array().optional(),
  meta: Joi.object().optional()
});

const updateTeacherSchema = createTeacherSchema.fork(['name','email'], (s) => s.optional());

module.exports = { createTeacherSchema, updateTeacherSchema };
