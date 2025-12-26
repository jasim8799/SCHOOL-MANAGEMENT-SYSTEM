const MessageLog = require('../models/MessageLog');
const School = require('../models/School');
const { sendMessage } = require('./messageService');

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;
const SUPPORTED_EVENTS = [
  'fee_reminder',
  'fee_paid',
  'exam_schedule_announced',
  'admit_card_published',
  'announcement_published',
  'exam_notes_published',
  'video_published',
  'student_admitted',
  'staff_created'
];

function normalizePreferences(prefs = {}) {
  return {
    enableWhatsApp: prefs.enableWhatsApp !== undefined ? prefs.enableWhatsApp : true,
    enableSMS: prefs.enableSMS !== undefined ? prefs.enableSMS : false,
    allowedEvents: Array.isArray(prefs.allowedEvents) && prefs.allowedEvents.length > 0 ? prefs.allowedEvents : SUPPORTED_EVENTS
  };
}

function normalizeTargets(target) {
  if (!target) return [];
  if (Array.isArray(target)) return target.filter(Boolean).map(String);
  if (typeof target === 'string') return [target];
  if (typeof target === 'object') {
    const list = [];
    if (Array.isArray(target.studentIds)) list.push(...target.studentIds.filter(Boolean).map(String));
    if (target.classId) list.push(`class:${target.classId}`);
    if (target.school) list.push('school:all');
    return list;
  }
  return [];
}

async function wasSentRecently({ schoolId, channel, to, eventType }) {
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const existing = await MessageLog.findOne({ schoolId, channel, template: eventType, to, createdAt: { $gte: since } }).select('_id');
  return !!existing;
}

async function dispatchNotification({ eventType, schoolId, target, payload = {}, createdBy }) {
  const school = await School.findOne({ schoolId }).lean();
  const prefs = normalizePreferences(school?.notificationPreferences || {});
  const modules = Array.isArray(school?.enabledModules) ? school.enabledModules : [];
  const recipients = normalizeTargets(target);

  // Always send in-app (no dedupe for in-app).
  for (const to of recipients) {
    await sendMessage({ schoolId, channel: 'in-app', to, template: eventType, payload, createdBy });
  }

  const outboundChannels = [];
  const whatsappEnabled = modules.includes('whatsapp_sms') && prefs.enableWhatsApp && prefs.allowedEvents.includes(eventType);
  const smsEnabled = modules.includes('whatsapp_sms') && prefs.enableSMS && prefs.allowedEvents.includes(eventType);
  if (whatsappEnabled) outboundChannels.push('whatsapp');
  if (smsEnabled) outboundChannels.push('sms');

  for (const channel of outboundChannels) {
    for (const to of recipients) {
      const recently = await wasSentRecently({ schoolId, channel, to, eventType });
      if (recently) continue;
      await sendMessage({ schoolId, channel, to, template: eventType, payload, createdBy });
    }
  }

  return { recipients: recipients.length, channels: outboundChannels };
}

module.exports = { dispatchNotification, SUPPORTED_EVENTS };
