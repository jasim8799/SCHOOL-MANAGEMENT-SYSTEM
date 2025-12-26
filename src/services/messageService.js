const MessageLog = require('../models/MessageLog');

// Simple in-memory rate limit counters per school
const rateCounters = new Map();
const RATE_LIMIT = 100; // messages per minute per school (demo)

function checkRateLimit(schoolId) {
  const key = String(schoolId);
  const now = Date.now();
  const entry = rateCounters.get(key) || { ts: now, count: 0 };
  if (now - entry.ts > 60000) {
    entry.ts = now;
    entry.count = 0;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  rateCounters.set(key, entry);
  return true;
}

async function sendMessage({ schoolId, channel, to, template, payload, createdBy }) {
  // rate limit
  if (!checkRateLimit(schoolId)) {
    const log = await MessageLog.create({ schoolId, channel, to, template, payload, status: 'failed', createdBy });
    return { success: false, reason: 'rate_limited', log };
  }

  // simulate provider (always success for demo)
  const status = 'sent';
  const log = await MessageLog.create({ schoolId, channel, to, template, payload, status, createdBy });
  return { success: true, log };
}

module.exports = { sendMessage };
