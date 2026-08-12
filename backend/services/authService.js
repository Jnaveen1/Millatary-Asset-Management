const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateUser = async (username, password) => {
  if (!username || !password) {
    const err = new Error('Username and password are required');
    err.status = 400;
    throw err;
  }

  const result = await db.query(
    `SELECT u.id, u.username, u.password_hash, u.role, u.base_id, b.name as base_name 
     FROM users u 
     LEFT JOIN bases b ON u.base_id = b.id 
     WHERE u.username = $1`,
    [username.trim()]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid username or password');
    err.status = 401;
    throw err;
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    const err = new Error('Invalid username or password');
    err.status = 401;
    throw err;
  }

  const tokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    baseId: user.base_id,
    baseName: user.base_name,
  };

  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET || 'super_secure_military_tactical_jwt_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: tokenPayload,
  };
};

const getUserProfile = async (userId) => {
  const result = await db.query(
    `SELECT u.id, u.username, u.role, u.base_id, b.name as base_name 
     FROM users u 
     LEFT JOIN bases b ON u.base_id = b.id 
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const user = result.rows[0];
  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    baseId: user.base_id,
    baseName: user.base_name,
  };
};

module.exports = {
  authenticateUser,
  getUserProfile,
};
