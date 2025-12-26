const School = require('../models/School');

function requireModule(moduleName) {
  return async (req, res, next) => {
    try {
      const schoolId = req.user && req.user.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Missing school context' });

      const school = await School.findOne({ schoolId });
      if (!school) return res.status(404).json({ error: 'School not found' });

      const enabled = Array.isArray(school.enabledModules) && school.enabledModules.includes(moduleName);
      if (!enabled) return res.status(403).json({ error: `${moduleName} module is disabled for this school` });
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireModule };
