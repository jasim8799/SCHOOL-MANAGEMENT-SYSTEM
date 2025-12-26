const Joi = require('joi');

const createAnnouncementSchema = Joi.object({
  title: Joi.string().required(),
  message: Joi.string().required(),
  type: Joi.string().valid('holiday', 'festival', 'notice', 'emergency').optional(),
  target: Joi.string().valid('school', 'class').optional(),
  classId: Joi.string().optional(),
  publishedAt: Joi.date().optional()
});

const updateAnnouncementSchema = createAnnouncementSchema.fork(
  ['title', 'message'],
  (s) => s.optional()
);

module.exports = { createAnnouncementSchema, updateAnnouncementSchema };
