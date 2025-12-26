const Joi = require('joi');

const createTeacherSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).optional(),
  meta: Joi.object().optional()
});

const updateTeacherSchema = createTeacherSchema.fork(['name','email'], (s) => s.optional());

module.exports = { createTeacherSchema, updateTeacherSchema };
