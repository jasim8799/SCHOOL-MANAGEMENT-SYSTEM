const Fee = require('../models/Fee');
const Student = require('../models/Student');
const User = require('../models/User');
const MessageLog = require('../models/MessageLog');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { ROLES } = require('../config/constants');

const MESSAGE_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // avoid spamming the same fee message in a short window

function isLate(fee) {
  if (!fee.dueDate) return false;
  return fee.status !== 'paid' && new Date(fee.dueDate).getTime() < Date.now();
}

async function resolveRecipient({ studentId, schoolId }) {
  // Prefer parent email if available; fall back to studentId for logging
  const student = await Student.findOne({ _id: studentId, schoolId }).select('parentIds');
  if (!student) return String(studentId);
  if (student.parentIds && student.parentIds.length > 0) {
    const parent = await User.findOne({ _id: { $in: student.parentIds }, schoolId }).select('email');
    if (parent && parent.email) return parent.email;
  }
  return String(studentId);
}

async function wasRecentlySent({ schoolId, feeId, template }) {
  const since = new Date(Date.now() - MESSAGE_DEDUP_WINDOW_MS);
  const existing = await MessageLog.findOne({ schoolId, template, 'payload.feeId': feeId, createdAt: { $gte: since } }).select('_id createdAt');
  return !!existing;
}

async function dispatchFeeMessage({ fee, template, createdBy, extraPayload = {} }) {
  const alreadySent = await wasRecentlySent({ schoolId: fee.schoolId, feeId: fee._id, template });
  if (alreadySent) return null;
  const to = await resolveRecipient({ studentId: fee.studentId, schoolId: fee.schoolId });
  const payload = {
    feeId: fee._id,
    studentId: fee.studentId,
    amount: fee.amount,
    status: fee.status,
    dueDate: fee.dueDate,
    lateFeeAmount: fee.lateFeeAmount || 0,
    ...extraPayload
  };
  return dispatchNotification({
    eventType: template === 'fee_payment_confirmation' ? 'fee_paid' : 'fee_reminder',
    schoolId: fee.schoolId,
    target: to,
    payload,
    createdBy
  });
}

async function maybeSendFeeReminder(fee, createdBy) {
  if (fee.status !== 'pending') return;
  await dispatchFeeMessage({ fee, template: 'fee_reminder', createdBy });
}

async function maybeSendPaymentConfirmation(fee, createdBy, prevStatus) {
  if (fee.status !== 'paid') return;
  if (prevStatus === 'paid') return;
  await dispatchFeeMessage({ fee, template: 'fee_payment_confirmation', createdBy });
}

async function maybeSendLateFeeMessage(fee, createdBy) {
  const lateFeeApplied = (fee.lateFeeAmount || 0) > 0 || isLate(fee);
  if (!lateFeeApplied) return;
  await dispatchFeeMessage({ fee, template: 'fee_late_fee', createdBy });
}

async function handleFeeNotifications({ fee, prevStatus, createdBy }) {
  try {
    await maybeSendPaymentConfirmation(fee, createdBy, prevStatus);
    await maybeSendFeeReminder(fee, createdBy);
    await maybeSendLateFeeMessage(fee, createdBy);
  } catch (err) {
    // Do not block main flow on notification errors
    console.error('Fee notification failed', err);
  }
}

async function createFee(req, res, next) {
  try {
    const payload = req.body;
    payload.schoolId = req.user.schoolId;
    payload.createdBy = req.user.userId;
    const f = await Fee.create(payload);
    await handleFeeNotifications({ fee: f, prevStatus: null, createdBy: req.user.userId });
    res.status(201).json(f);
  } catch (err) {
    next(err);
  }
}

async function updateFee(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fee = await Fee.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!fee) return res.status(404).json({ error: 'Fee not found' });

    const prevStatus = fee.status;
    fee.set(updates);
    const updated = await fee.save();

    await handleFeeNotifications({ fee: updated, prevStatus, createdBy: req.user.userId });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function getFees(req, res, next) {
  try {
    const { studentId, classId } = req.query;
    const filter = { schoolId: req.user.schoolId };
    const role = req.user.role;

    if (role === ROLES.STUDENT) {
      filter.studentId = req.user.userId;
    } else if (role === ROLES.PARENT) {
      if (studentId) {
        const ownsChild = await Student.exists({ _id: studentId, schoolId: req.user.schoolId, parentIds: req.user.userId });
        if (!ownsChild) return res.status(403).json({ error: 'Not authorized for this student' });
        filter.studentId = studentId;
      } else {
        const child = await Student.findOne({ parentIds: req.user.userId, schoolId: req.user.schoolId }).select('_id');
        if (!child) return res.json([]);
        filter.studentId = child._id;
      }
    } else {
      if (studentId) filter.studentId = studentId;
      if (classId) filter.classId = classId;
    }

    const list = await Fee.find(filter).sort({ dueDate: 1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function getFeeSummary(req, res, next) {
  try {
    const { classId } = req.query;
    const match = { schoolId: req.user.schoolId };
    if (classId) match.classId = classId;
    const agg = await Fee.aggregate([
      { $match: match },
      { $group: { _id: '$status', total: { $sum: { $add: ['$amount', { $ifNull: ['$lateFeeAmount', 0] }] } }, count: { $sum: 1 } } }
    ]);
    const summary = { total: 0, pending: 0, paid: 0, partial: 0 };
    agg.forEach((s) => {
      summary.total += s.total;
      if (s._id === 'pending') summary.pending = s.total;
      if (s._id === 'paid') summary.paid = s.total;
      if (s._id === 'partial') summary.partial = s.total;
    });
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

module.exports = { createFee, updateFee, getFees, getFeeSummary };
