const { verify } = require('../utils/jwt');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const payload = verify(token);
    // payload should contain userId, role, schoolId
    if (!payload || !payload.userId) return res.status(401).json({ error: 'Invalid token' });

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      role: payload.role,
      schoolId: payload.schoolId
    };

    // Optionally load user minimal info (active)
    const user = await User.findOne({ _id: payload.userId, schoolId: payload.schoolId }).select('name email role isActive');
    if (!user) return res.status(401).json({ error: 'User not found or not in school' });
    if (!user.isActive) return res.status(403).json({ error: 'User is inactive' });

    req.user.name = user.name;
    req.user.email = user.email;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
}

module.exports = auth;
