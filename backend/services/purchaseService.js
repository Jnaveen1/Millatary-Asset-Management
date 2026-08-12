const db = require('../config/db');

const executePurchase = async ({ baseId, equipmentTypeId, quantity, purchaseDate, createdBy }) => {
  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    const err = new Error('Quantity must be a positive integer greater than zero');
    err.status = 400;
    throw err;
  }

  const baseCheck = await db.query('SELECT name FROM bases WHERE id = $1', [baseId]);
  if (baseCheck.rows.length === 0) {
    const err = new Error(`Invalid base ID: ${baseId}`);
    err.status = 400;
    throw err;
  }

  const equipCheck = await db.query('SELECT name FROM equipment_types WHERE id = $1', [equipmentTypeId]);
  if (equipCheck.rows.length === 0) {
    const err = new Error(`Invalid equipment type ID: ${equipmentTypeId}`);
    err.status = 400;
    throw err;
  }

  const dateVal = purchaseDate ? new Date(purchaseDate) : new Date();

  const insertRes = await db.query(
    `INSERT INTO purchases (base_id, equipment_type_id, quantity, purchase_date, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, base_id, equipment_type_id, quantity, purchase_date, created_at`,
    [baseId, equipmentTypeId, parsedQty, dateVal, createdBy]
  );

  const purchase = insertRes.rows[0];

  await db.query(
    `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
    [
      createdBy,
      'PURCHASE',
      JSON.stringify({
        purchaseId: purchase.id,
        baseId,
        baseName: baseCheck.rows[0].name,
        equipmentTypeId,
        equipmentName: equipCheck.rows[0].name,
        quantity: parsedQty,
        purchaseDate: dateVal,
      }),
    ]
  );

  return purchase;
};

const getPurchases = async ({ baseId, equipmentTypeId }) => {
  let queryText = `
    SELECT 
      p.id,
      p.base_id,
      b.name as base_name,
      p.equipment_type_id,
      et.name as equipment_name,
      et.category,
      p.quantity,
      p.purchase_date,
      p.created_at,
      u.username as created_by_username
    FROM purchases p
    JOIN bases b ON p.base_id = b.id
    JOIN equipment_types et ON p.equipment_type_id = et.id
    JOIN users u ON p.created_by = u.id
  `;

  const whereClauses = [];
  const params = [];

  if (baseId) {
    params.push(baseId);
    whereClauses.push(`p.base_id = $${params.length}`);
  }

  if (equipmentTypeId) {
    params.push(equipmentTypeId);
    whereClauses.push(`p.equipment_type_id = $${params.length}`);
  }

  if (whereClauses.length > 0) {
    queryText += ' WHERE ' + whereClauses.join(' AND ');
  }

  queryText += ' ORDER BY p.purchase_date DESC, p.id DESC';

  const result = await db.query(queryText, params);
  return result.rows;
};

module.exports = {
  executePurchase,
  getPurchases,
};
