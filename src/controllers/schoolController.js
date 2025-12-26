const School = require('../models/School');

async function getSchool(req, res, next) {
  try {
    const id = req.params.id;
    const school = await School.findOne({ $or: [{ _id: id }, { schoolId: id }] }).select('name logoUrl enabledModules storageLimitMB domain');
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json(school);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSchool };
