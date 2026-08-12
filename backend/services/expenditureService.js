const db = require('../config/db');
const { getAvailableStock } = require('./inventoryService');

const executeExpenditure = async ({ baseId, equipmentTypeId, quantity, reason, expenditureDate, createdBy }) => {
  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    const err = new Error('Expenditure quantity must be a positive integer');
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

  const stockInfo = await getAvailableStock(baseId, equipmentTypeId);
  if (parsedQty > stockInfo.availableStock) {
    const err = new Error(
      `Insufficient inventory at base '${baseCheck.rows[0].name}'. Available: ${stockInfo.availableStock}, Requested: ${parsedQty}`
    );
    err.status = 400;
    err.availableStock = stockInfo.availableStock;
    err.requestedQuantity = parsedQty;
    throw err;
  }

  const dateVal = expenditureDate ? new Date(expenditureDate) : new Date();
  const reasonText = reason ? reason.trim() : 'Operational consumption';

  const insertRes = await db.query(
    `INSERT INTO expenditures (base_id, equipment_type_id, quantity, expenditure_date, reason, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, base_id, equipment_type_id, quantity, expenditure_date, reason, created_at`,
    [baseId, equipmentTypeId, parsedQty, dateVal, reasonText, createdBy]
  );

  const expenditure = insertRes.rows[0];

  await db.query(
    `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
    [
      createdBy,
      'EXPENDITURE',
      JSON.stringify({
        expenditureId: expenditure.id,
        baseId,
        baseName: baseCheck.rows[0].name,
        equipmentTypeId,
        equipmentName: equipCheck.rows[0].name,
        quantity: parsedQty,
        reason: reasonText,
        expenditureDate: dateVal,
      }),
    ]
  );

  return expenditure;
};

const getExpenditures = async ({ baseId, equipmentTypeId }) => {
  let queryText = `
    SELECT 
      e.id,
      e.base_id,
      b.name as base_name,
      e.equipment_type_id,
      et.name as equipment_name,
      et.category,
      e.quantity,
      e.expenditure_date,
      e.reason,
      e.created_at,
      u.username as created_by_username
    FROM expenditures e
    JOIN bases b ON e.base_id = b.id
    JOIN equipment_types et ON e.equipment_type_id = et.id
    JOIN users u ON e.created_by = u.id
  `;

  const whereClauses = [];
  const params = [];

  if (baseId) {
    params.push(baseId);
    whereClauses.push(`e.base_id = $${params.length}`);
  }

  if (equipmentTypeId) {
    params.push(equipmentTypeId);
    whereClauses.push(`e.equipment_type_id = $${params.length}`);
  }

  if (whereClauses.length > 0) {
    queryText += ' WHERE ' + whereClauses.join(' AND ');
  }

  queryText += ' ORDER BY e.expenditure_date DESC, e.id DESC';

  const result = await db.query(queryText, params);
  return result.rows;
};

module.exports = {
  executeExpenditure,
  getExpenditures,
};
