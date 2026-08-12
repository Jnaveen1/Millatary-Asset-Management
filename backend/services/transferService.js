const db = require('../config/db');
const { getAvailableStock } = require('./inventoryService');

/**
 * Service: Transfer Service
 * Handles inter-base asset transfers with CONCURRENCY-SAFE PostgreSQL row locking.
 */
const executeTransfer = async ({ sourceBaseId, destinationBaseId, equipmentTypeId, quantity, transferDate, initiatedBy }) => {
  const srcId = Number(sourceBaseId);
  const destId = Number(destinationBaseId);
  const equipId = Number(equipmentTypeId);
  const parsedQty = parseInt(quantity, 10);

  if (srcId === destId) {
    const err = new Error('Source base and destination base cannot be the same base');
    err.status = 400;
    throw err;
  }

  if (isNaN(parsedQty) || parsedQty <= 0) {
    const err = new Error('Transfer quantity must be a positive integer greater than zero');
    err.status = 400;
    throw err;
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. CONCURRENCY-SAFE ROW LOCKING: Lock source base and equipment type records
    // FOR UPDATE locks prevent concurrent transactions from reading/updating stock simultaneously!
    const srcCheck = await client.query('SELECT name FROM bases WHERE id = $1 FOR UPDATE', [srcId]);
    if (srcCheck.rows.length === 0) {
      const err = new Error(`Invalid source base ID: ${srcId}`);
      err.status = 400;
      throw err;
    }

    const destCheck = await client.query('SELECT name FROM bases WHERE id = $1 FOR UPDATE', [destId]);
    if (destCheck.rows.length === 0) {
      const err = new Error(`Invalid destination base ID: ${destId}`);
      err.status = 400;
      throw err;
    }

    const equipCheck = await client.query('SELECT name FROM equipment_types WHERE id = $1 FOR UPDATE', [equipId]);
    if (equipCheck.rows.length === 0) {
      const err = new Error(`Invalid equipment type ID: ${equipId}`);
      err.status = 400;
      throw err;
    }

    // 2. Evaluate available stock under lock
    const stockInfo = await getAvailableStock(srcId, equipId, client);
    if (parsedQty > stockInfo.availableStock) {
      const err = new Error(
        `Insufficient inventory at source base '${srcCheck.rows[0].name}'. Available: ${stockInfo.availableStock}, Requested: ${parsedQty}`
      );
      err.status = 400;
      err.availableStock = stockInfo.availableStock;
      err.requestedQuantity = parsedQty;
      throw err;
    }

    const dateVal = transferDate ? new Date(transferDate) : new Date();

    // 3. Create Transfer record
    const transferRes = await client.query(
      `INSERT INTO transfers (source_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, initiated_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED')
       RETURNING id, source_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, status, created_at`,
      [srcId, destId, equipId, parsedQty, dateVal, initiatedBy]
    );

    const transfer = transferRes.rows[0];

    // 4. Record Audit Log inside the exact same database transaction
    await client.query(
      `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [
        initiatedBy,
        'TRANSFER',
        JSON.stringify({
          transferId: transfer.id,
          sourceBaseId: srcId,
          sourceBaseName: srcCheck.rows[0].name,
          destinationBaseId: destId,
          destinationBaseName: destCheck.rows[0].name,
          equipmentTypeId: equipId,
          equipmentName: equipCheck.rows[0].name,
          quantity: parsedQty,
          transferDate: dateVal,
        }),
      ]
    );

    await client.query('COMMIT');

    return {
      ...transfer,
      sourceBaseName: srcCheck.rows[0].name,
      destinationBaseName: destCheck.rows[0].name,
      equipmentName: equipCheck.rows[0].name,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getTransfers = async ({ baseId, equipmentTypeId }) => {
  let queryText = `
    SELECT 
      t.id,
      t.source_base_id,
      sb.name as source_base_name,
      t.destination_base_id,
      db_b.name as destination_base_name,
      t.equipment_type_id,
      et.name as equipment_name,
      et.category,
      t.quantity,
      t.transfer_date,
      t.status,
      t.created_at,
      u.username as initiated_by_username
    FROM transfers t
    JOIN bases sb ON t.source_base_id = sb.id
    JOIN bases db_b ON t.destination_base_id = db_b.id
    JOIN equipment_types et ON t.equipment_type_id = et.id
    JOIN users u ON t.initiated_by = u.id
  `;

  const whereClauses = [];
  const params = [];

  if (baseId) {
    params.push(baseId);
    whereClauses.push(`(t.source_base_id = $${params.length} OR t.destination_base_id = $${params.length})`);
  }

  if (equipmentTypeId) {
    params.push(equipmentTypeId);
    whereClauses.push(`t.equipment_type_id = $${params.length}`);
  }

  if (whereClauses.length > 0) {
    queryText += ' WHERE ' + whereClauses.join(' AND ');
  }

  queryText += ' ORDER BY t.transfer_date DESC, t.id DESC';

  const result = await db.query(queryText, params);
  return result.rows;
};

module.exports = {
  executeTransfer,
  getTransfers,
};
