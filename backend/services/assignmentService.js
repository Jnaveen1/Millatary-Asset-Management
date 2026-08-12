const db = require('../config/db');
const { getAvailableStock } = require('./inventoryService');

const executeAssignment = async ({ baseId, equipmentTypeId, quantity, assignedTo, assignmentDate, createdBy }) => {
  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    const err = new Error('Assignment quantity must be a positive integer');
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

  const dateVal = assignmentDate ? new Date(assignmentDate) : new Date();

  const insertRes = await db.query(
    `INSERT INTO assignments (base_id, equipment_type_id, quantity, assigned_to, assignment_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, base_id, equipment_type_id, quantity, assigned_to, assignment_date, created_at`,
    [baseId, equipmentTypeId, parsedQty, assignedTo.trim(), dateVal, createdBy]
  );

  const assignment = insertRes.rows[0];

  await db.query(
    `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
    [
      createdBy,
      'ASSIGNMENT',
      JSON.stringify({
        assignmentId: assignment.id,
        baseId,
        baseName: baseCheck.rows[0].name,
        equipmentTypeId,
        equipmentName: equipCheck.rows[0].name,
        quantity: parsedQty,
        assignedTo: assignedTo.trim(),
        assignmentDate: dateVal,
      }),
    ]
  );

  return assignment;
};

const getAssignments = async ({ baseId, equipmentTypeId }) => {
  let queryText = `
    SELECT 
      a.id,
      a.base_id,
      b.name as base_name,
      a.equipment_type_id,
      et.name as equipment_name,
      et.category,
      a.quantity,
      a.assigned_to,
      a.assignment_date,
      a.created_at,
      u.username as created_by_username
    FROM assignments a
    JOIN bases b ON a.base_id = b.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    JOIN users u ON a.created_by = u.id
  `;

  const whereClauses = [];
  const params = [];

  if (baseId) {
    params.push(baseId);
    whereClauses.push(`a.base_id = $${params.length}`);
  }

  if (equipmentTypeId) {
    params.push(equipmentTypeId);
    whereClauses.push(`a.equipment_type_id = $${params.length}`);
  }

  if (whereClauses.length > 0) {
    queryText += ' WHERE ' + whereClauses.join(' AND ');
  }

  queryText += ' ORDER BY a.assignment_date DESC, a.id DESC';

  const result = await db.query(queryText, params);
  return result.rows;
};

module.exports = {
  executeAssignment,
  getAssignments,
};
