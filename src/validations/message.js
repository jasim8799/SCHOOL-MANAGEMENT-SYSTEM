const Joi = require('joi');

const sendMessageSchema = Joi.object({
  channel: Joi.string().valid('sms','whatsapp','in-app').required(),
  to: Joi.string().required(),
  template: Joi.string().optional(),
  payload: Joi.object().optional()
});

module.exports = { sendMessageSchema };
