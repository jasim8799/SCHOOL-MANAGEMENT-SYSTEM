const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  schoolId: Joi.string().required()
});

module.exports = { loginSchema };
