const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const School = require('../models/School');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../config/constants');

async function bootstrap(req, res, next) {
  try {
    const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!secret) return res.status(404).json({ error: 'Bootstrap disabled' });
    const provided = req.body && req.body.secret;
    if (!provided || provided !== secret) return res.status(403).json({ error: 'Invalid bootstrap secret' });

    const { school = {}, principal = {} } = req.body;
    if (!school.name || !principal.email || !principal.password) return res.status(400).json({ error: 'Missing school or principal details' });

    // Create or update school
    let s = await School.findOne({ name: school.name });
    if (!s) {
      s = new School({ name: school.name, enabledModules: school.enabledModules || [] });
      await s.save();
    } else {
      s.enabledModules = Array.from(new Set([...(s.enabledModules || []), ...(school.enabledModules || [])]));
      await s.save();
    }

    // Create or update principal
    let p = await User.findOne({ email: principal.email.toLowerCase(), schoolId: s.schoolId || s._id });
    if (!p) {
      const passwordHash = await hashPassword(principal.password);
      p = new User({
        schoolId: s.schoolId || s._id,
        name: principal.name || 'Principal',
        email: principal.email.toLowerCase(),
        passwordHash,
        role: ROLES.PRINCIPAL,
        isActive: true
      });
      await p.save();
    }

    res.json({ success: true, schoolId: s.schoolId || s._id, principalEmail: p.email });
  } catch (err) {
    next(err);
  }
}

module.exports = { bootstrap };
