const Joi = require('joi');

const createAttendanceSchema = Joi.object({
  studentId: Joi.string().required(),
  classId: Joi.string().optional(),
  subjectId: Joi.string().optional(),
  date: Joi.date().required(),
  status: Joi.string().valid('present','absent','late','excused').required(),
  notes: Joi.string().optional()
});

const updateAttendanceSchema = createAttendanceSchema.fork(['studentId','date','status'], (s) => s.optional());

module.exports = { createAttendanceSchema, updateAttendanceSchema };
