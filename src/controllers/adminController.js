const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const School = require('../models/School');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../config/constants');

/**
 * One-time bootstrap API
 * Creates first School + Principal
 * Protected by ADMIN_BOOTSTRAP_SECRET (header: x-admin-secret)
 */
async function bootstrap(req, res, next) {
  try {
    const envSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

    // If bootstrap is disabled
    if (!envSecret) {
      return res.status(404).json({ error: 'Bootstrap disabled' });
    }

    // ✅ FIX: read secret from HEADER (not body)
    const providedSecret = req.headers['x-admin-secret'];

    if (!providedSecret || providedSecret !== envSecret) {
      return res.status(403).json({ error: 'Invalid bootstrap secret' });
    }

    const { school = {}, principal = {} } = req.body;

    if (!school.name || !principal.email || !principal.password) {
      return res
        .status(400)
        .json({ error: 'Missing school or principal details' });
    }

    // -----------------------------
    // Create or update School
    // -----------------------------
    let schoolDoc = await School.findOne({ name: school.name });

    if (!schoolDoc) {
      schoolDoc = new School({
        name: school.name,
        code: school.code || undefined,
        enabledModules: school.enabledModules || [],
      });
      await schoolDoc.save();
    } else {
      // merge enabled modules safely
      if (Array.isArray(school.enabledModules)) {
        schoolDoc.enabledModules = Array.from(
          new Set([...(schoolDoc.enabledModules || []), ...school.enabledModules])
        );
        await schoolDoc.save();
      }
    }

    // -----------------------------
    // Create Principal User
    // -----------------------------
    let principalUser = await User.findOne({
      email: principal.email.toLowerCase(),
      schoolId: schoolDoc._id,
    });

    if (!principalUser) {
      const passwordHash = await hashPassword(principal.password);

      principalUser = new User({
        schoolId: schoolDoc._id,
        name: principal.name || 'Principal',
        email: principal.email.toLowerCase(),
        passwordHash,
        role: ROLES.PRINCIPAL,
        isActive: true,
      });

      await principalUser.save();
    }

    // -----------------------------
    // Success response
    // -----------------------------
    return res.json({
      success: true,
      schoolId: schoolDoc._id,
      principalEmail: principalUser.email,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  bootstrap,
};

