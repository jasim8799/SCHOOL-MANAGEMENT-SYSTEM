const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function sign(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function verify(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = { sign, verify };
