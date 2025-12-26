const Joi = require('joi');

// Staff: email + password + schoolId
const staffLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  schoolId: Joi.string().required(),
});

// Student/Parent: userId or mobile + password (no schoolId)
const studentParentLogin = Joi.object({
  userId: Joi.string().allow('').optional(),
  mobile: Joi.string().allow('').optional(),
  password: Joi.string().required(),
}).custom((value, helpers) => {
  if (!value.userId && !value.mobile) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'Require userId or mobile');

const loginSchema = Joi.alternatives().try(staffLogin, studentParentLogin);

const requestOtpSchema = Joi.object({
  challengeId: Joi.string().required(),
  channel: Joi.string().valid('sms', 'whatsapp').optional(),
});

const verifyOtpSchema = Joi.object({
  challengeId: Joi.string().required(),
  otp: Joi.string().pattern(/^[0-9]{6}$/).required(),
});

module.exports = { loginSchema, requestOtpSchema, verifyOtpSchema };
