const db = require('../config/db');

const getBases = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, location, created_at FROM bases ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get bases error:', error);
    res.status(500).json({ error: 'Failed to retrieve bases' });
  }
};

module.exports = {
  getBases,
};
