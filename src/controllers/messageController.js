const MessageLog = require('../models/MessageLog');
const { sendMessage } = require('../services/messageService');

async function send(req, res, next) {
  try {
    const { channel, to, template, payload } = req.body;
    const schoolId = req.user.schoolId;
    const createdBy = req.user.userId;
    const result = await sendMessage({ schoolId, channel, to, template, payload, createdBy });
    if (!result.success) return res.status(429).json({ error: 'Rate limited' });
    res.json({ success: true, log: result.log });
  } catch (err) {
    next(err);
  }
}

async function listLogs(req, res, next) {
  try {
    const filter = { schoolId: req.user.schoolId };
    const logs = await MessageLog.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

module.exports = { send, listLogs };
