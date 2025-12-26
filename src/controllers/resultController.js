const Result = require('../models/Result');

async function createResult(req, res, next) {
  try {
    const payload = req.body;
    payload.schoolId = req.user.schoolId;
    payload.createdBy = req.user.userId;
    const doc = await Result.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

async function listResults(req, res, next) {
  try {
    const filter = { schoolId: req.user.schoolId };
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.examId) filter.examId = req.query.examId;
    const docs = await Result.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

async function getResult(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Result.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!doc) return res.status(404).json({ error: 'Result not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function updateResult(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const doc = await Result.findOneAndUpdate({ _id: id, schoolId: req.user.schoolId }, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Result not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function deleteResult(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Result.findOneAndDelete({ _id: id, schoolId: req.user.schoolId });
    if (!doc) return res.status(404).json({ error: 'Result not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createResult, listResults, getResult, updateResult, deleteResult };
