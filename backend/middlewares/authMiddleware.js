const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'super_secure_military_tactical_jwt_secret_key_2026', (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    }
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken,
};
