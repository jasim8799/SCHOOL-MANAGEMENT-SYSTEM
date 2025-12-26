const Joi = require('joi');

const subjectSchema = Joi.object({
  subject: Joi.string().required(),
  date: Joi.date().optional(),
  notes: Joi.string().optional()
});

const createExamSchema = Joi.object({
  name: Joi.string().optional(),
  examName: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  classId: Joi.string().optional(),
  subjects: Joi.array().items(subjectSchema).optional(),
  admitCardEnabled: Joi.boolean().optional(),
  meta: Joi.object().optional()
}).custom((value, helpers) => {
  if (!value.name && !value.examName) {
    return helpers.error('any.custom', { message: 'name or examName is required' });
  }
  return value;
}, 'name/examName requirement');

const updateExamSchema = createExamSchema;

module.exports = { createExamSchema, updateExamSchema };
