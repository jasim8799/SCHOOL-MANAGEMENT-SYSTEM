const { ROLES } = require('../config/constants');

function authorize(allowedRoles = []) {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role) return res.status(403).json({ error: 'Role not found' });
    if (allowedRoles.length === 0) return next();
    if (allowedRoles.includes(role)) return next();
    return res.status(403).json({ error: 'Insufficient role privileges' });
  };
}

module.exports = { authorize };
