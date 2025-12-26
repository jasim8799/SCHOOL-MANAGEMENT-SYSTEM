const Joi = require('joi');

module.exports = {
  createExamNote: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    examId: Joi.string().required(),
    subjectId: Joi.string().optional(),
    classId: Joi.string().required(),
    attachmentUrl: Joi.string().uri().optional()
  })
};
