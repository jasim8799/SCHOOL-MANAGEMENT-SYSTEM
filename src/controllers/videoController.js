const Video = require('../models/Video');
const { dispatchNotification } = require('../services/notificationDispatcher');

async function createVideo(req, res, next) {
  try {
    const payload = req.body;
    payload.schoolId = req.user.schoolId;
    payload.createdBy = req.user.userId;
    const doc = await Video.create(payload);
    const target = doc.classId ? `class:${doc.classId}` : 'school:all';
    await dispatchNotification({
      eventType: 'video_published',
      schoolId: doc.schoolId,
      target,
      payload: {
        videoId: doc._id,
        title: doc.title,
        classId: doc.classId,
        url: doc.url
      },
      createdBy: req.user.userId
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

async function listVideos(req, res, next) {
  try {
    const filter = { schoolId: req.user.schoolId };
    if (req.query.classId) filter.classId = req.query.classId;
    const docs = await Video.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

async function getVideo(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Video.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!doc) return res.status(404).json({ error: 'Video not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function updateVideo(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const doc = await Video.findOneAndUpdate({ _id: id, schoolId: req.user.schoolId }, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Video not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function deleteVideo(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Video.findOneAndDelete({ _id: id, schoolId: req.user.schoolId });
    if (!doc) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createVideo, listVideos, getVideo, updateVideo, deleteVideo };
