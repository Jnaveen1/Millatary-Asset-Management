const db = require('../config/db');

const getEquipmentTypes = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, category, description, created_at FROM equipment_types ORDER BY category, name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get equipment types error:', error);
    res.status(500).json({ error: 'Failed to retrieve equipment types' });
  }
};

module.exports = {
  getEquipmentTypes,
};
