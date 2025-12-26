const User = require('../models/User');
const { comparePassword } = require('../utils/password');
const { sign } = require('../utils/jwt');

async function login(req, res, next) {
  try {
    const { email, password, schoolId } = req.body;
    if (!email || !password || !schoolId) return res.status(400).json({ error: 'email, password and schoolId required' });

    const user = await User.findOne({ email: email.toLowerCase(), schoolId });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign({ userId: user._id.toString(), role: user.role, schoolId: user.schoolId.toString() });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, schoolId: user.schoolId } });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
