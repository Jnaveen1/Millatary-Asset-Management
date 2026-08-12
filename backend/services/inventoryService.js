const db = require('../config/db');

/**
 * Service: Inventory Service
 * Encapsulates core transactional balance calculations and stock queries.
 */

/**
 * Calculates current available stock for a specific base & equipment type.
 * Accepts optional PostgreSQL client for execution within SQL transactions (with row locks).
 */
const getAvailableStock = async (baseId, equipmentTypeId, client = db) => {
  const queryText = `
    SELECT 
      COALESCE((SELECT SUM(quantity) FROM purchases WHERE base_id = $1 AND equipment_type_id = $2), 0) as purchases,
      COALESCE((SELECT SUM(quantity) FROM transfers WHERE destination_base_id = $1 AND equipment_type_id = $2), 0) as transfers_in,
      COALESCE((SELECT SUM(quantity) FROM transfers WHERE source_base_id = $1 AND equipment_type_id = $2), 0) as transfers_out,
      COALESCE((SELECT SUM(quantity) FROM assignments WHERE base_id = $1 AND equipment_type_id = $2), 0) as assigned,
      COALESCE((SELECT SUM(quantity) FROM expenditures WHERE base_id = $1 AND equipment_type_id = $2), 0) as expended
  `;

  const res = await client.query(queryText, [baseId, equipmentTypeId]);
  const row = res.rows[0];

  const purchases = parseInt(row.purchases, 10);
  const transfersIn = parseInt(row.transfers_in, 10);
  const transfersOut = parseInt(row.transfers_out, 10);
  const assigned = parseInt(row.assigned, 10);
  const expended = parseInt(row.expended, 10);

  const availableStock = (purchases + transfersIn) - transfersOut - assigned - expended;

  return {
    baseId: Number(baseId),
    equipmentTypeId: Number(equipmentTypeId),
    purchases,
    transfersIn,
    transfersOut,
    assigned,
    expended,
    availableStock,
  };
};

/**
 * Computes dynamic inventory dashboard metrics and period movements.
 */
const getDashboardMetrics = async ({ baseId, equipmentTypeId, startDate, endDate }) => {
  const queryParamsPurchases = [];
  const queryParamsTransfersIn = [];
  const queryParamsTransfersOut = [];
  const queryParamsAssignments = [];
  const queryParamsExpenditures = [];

  let pIdxP = 1, pIdxTIn = 1, pIdxTOut = 1, pIdxA = 1, pIdxE = 1;

  let whereP = [], whereTIn = [], whereTOut = [], whereA = [], whereE = [];
  let wherePBefore = [], whereTInBefore = [], whereTOutBefore = [], whereABefore = [], whereEBefore = [];

  if (baseId) {
    whereP.push(`base_id = $${pIdxP++}`); queryParamsPurchases.push(baseId);
    whereTIn.push(`destination_base_id = $${pIdxTIn++}`); queryParamsTransfersIn.push(baseId);
    whereTOut.push(`source_base_id = $${pIdxTOut++}`); queryParamsTransfersOut.push(baseId);
    whereA.push(`base_id = $${pIdxA++}`); queryParamsAssignments.push(baseId);
    whereE.push(`base_id = $${pIdxE++}`); queryParamsExpenditures.push(baseId);
  }

  if (equipmentTypeId) {
    whereP.push(`equipment_type_id = $${pIdxP++}`); queryParamsPurchases.push(equipmentTypeId);
    whereTIn.push(`equipment_type_id = $${pIdxTIn++}`); queryParamsTransfersIn.push(equipmentTypeId);
    whereTOut.push(`equipment_type_id = $${pIdxTOut++}`); queryParamsTransfersOut.push(equipmentTypeId);
    whereA.push(`equipment_type_id = $${pIdxA++}`); queryParamsAssignments.push(equipmentTypeId);
    whereE.push(`equipment_type_id = $${pIdxE++}`); queryParamsExpenditures.push(equipmentTypeId);
  }

  wherePBefore = [...whereP]; whereTInBefore = [...whereTIn]; whereTOutBefore = [...whereTOut]; whereABefore = [...whereA]; whereEBefore = [...whereE];
  const paramsPBefore = [...queryParamsPurchases];
  const paramsTInBefore = [...queryParamsTransfersIn];
  const paramsTOutBefore = [...queryParamsTransfersOut];
  const paramsABefore = [...queryParamsAssignments];
  const paramsEBefore = [...queryParamsExpenditures];

  if (startDate) {
    whereP.push(`purchase_date >= $${pIdxP++}`); queryParamsPurchases.push(startDate);
    whereTIn.push(`transfer_date >= $${pIdxTIn++}`); queryParamsTransfersIn.push(startDate);
    whereTOut.push(`transfer_date >= $${pIdxTOut++}`); queryParamsTransfersOut.push(startDate);
    whereA.push(`assignment_date >= $${pIdxA++}`); queryParamsAssignments.push(startDate);
    whereE.push(`expenditure_date >= $${pIdxE++}`); queryParamsExpenditures.push(startDate);

    wherePBefore.push(`purchase_date < $${paramsPBefore.length + 1}`); paramsPBefore.push(startDate);
    whereTInBefore.push(`transfer_date < $${paramsTInBefore.length + 1}`); paramsTInBefore.push(startDate);
    whereTOutBefore.push(`transfer_date < $${paramsTOutBefore.length + 1}`); paramsTOutBefore.push(startDate);
    whereABefore.push(`assignment_date < $${paramsABefore.length + 1}`); paramsABefore.push(startDate);
    whereEBefore.push(`expenditure_date < $${paramsEBefore.length + 1}`); paramsEBefore.push(startDate);
  }

  if (endDate) {
    whereP.push(`purchase_date <= $${pIdxP++}`); queryParamsPurchases.push(endDate);
    whereTIn.push(`transfer_date <= $${pIdxTIn++}`); queryParamsTransfersIn.push(endDate);
    whereTOut.push(`transfer_date <= $${pIdxTOut++}`); queryParamsTransfersOut.push(endDate);
    whereA.push(`assignment_date <= $${pIdxA++}`); queryParamsAssignments.push(endDate);
    whereE.push(`expenditure_date <= $${pIdxE++}`); queryParamsExpenditures.push(endDate);
  }

  const clauseP = whereP.length > 0 ? 'WHERE ' + whereP.join(' AND ') : '';
  const clauseTIn = whereTIn.length > 0 ? 'WHERE ' + whereTIn.join(' AND ') : '';
  const clauseTOut = whereTOut.length > 0 ? 'WHERE ' + whereTOut.join(' AND ') : '';
  const clauseA = whereA.length > 0 ? 'WHERE ' + whereA.join(' AND ') : '';
  const clauseE = whereE.length > 0 ? 'WHERE ' + whereE.join(' AND ') : '';

  const resP = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM purchases ${clauseP}`, queryParamsPurchases);
  const resTIn = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM transfers ${clauseTIn}`, queryParamsTransfersIn);
  const resTOut = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM transfers ${clauseTOut}`, queryParamsTransfersOut);
  const resA = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM assignments ${clauseA}`, queryParamsAssignments);
  const resE = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM expenditures ${clauseE}`, queryParamsExpenditures);

  const purchases = parseInt(resP.rows[0].total, 10);
  const transfersIn = parseInt(resTIn.rows[0].total, 10);
  const transfersOut = parseInt(resTOut.rows[0].total, 10);
  const assigned = parseInt(resA.rows[0].total, 10);
  const expended = parseInt(resE.rows[0].total, 10);

  let openingBalance = 0;
  if (startDate) {
    const clausePBefore = wherePBefore.length > 0 ? 'WHERE ' + wherePBefore.join(' AND ') : '';
    const clauseTInBefore = whereTInBefore.length > 0 ? 'WHERE ' + whereTInBefore.join(' AND ') : '';
    const clauseTOutBefore = whereTOutBefore.length > 0 ? 'WHERE ' + whereTOutBefore.join(' AND ') : '';
    const clauseABefore = whereABefore.length > 0 ? 'WHERE ' + whereABefore.join(' AND ') : '';
    const clauseEBefore = whereEBefore.length > 0 ? 'WHERE ' + whereEBefore.join(' AND ') : '';

    const rPB = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM purchases ${clausePBefore}`, paramsPBefore);
    const rTIB = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM transfers ${clauseTInBefore}`, paramsTInBefore);
    const rTOB = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM transfers ${clauseTOutBefore}`, paramsTOutBefore);
    const rAB = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM assignments ${clauseABefore}`, paramsABefore);
    const rEB = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM expenditures ${clauseEBefore}`, paramsEBefore);

    const pB = parseInt(rPB.rows[0].total, 10);
    const tIB = parseInt(rTIB.rows[0].total, 10);
    const tOB = parseInt(rTOB.rows[0].total, 10);
    const aB = parseInt(rAB.rows[0].total, 10);
    const eB = parseInt(rEB.rows[0].total, 10);

    openingBalance = (pB + tIB) - tOB - aB - eB;
  }

  const netMovement = purchases + transfersIn - transfersOut;
  const closingBalance = openingBalance + netMovement - assigned - expended;

  const inventoryQuery = `
    SELECT 
      b.id as base_id,
      b.name as base_name,
      et.id as equipment_type_id,
      et.name as equipment_name,
      et.category,
      COALESCE(p.total_purchases, 0) as purchases,
      COALESCE(ti.total_transfers_in, 0) as transfers_in,
      COALESCE(to_t.total_transfers_out, 0) as transfers_out,
      COALESCE(a.total_assigned, 0) as assigned,
      COALESCE(e.total_expended, 0) as expended,
      (COALESCE(p.total_purchases, 0) + COALESCE(ti.total_transfers_in, 0) - COALESCE(to_t.total_transfers_out, 0) - COALESCE(a.total_assigned, 0) - COALESCE(e.total_expended, 0)) as current_balance
    FROM bases b
    CROSS JOIN equipment_types et
    LEFT JOIN (
      SELECT base_id, equipment_type_id, SUM(quantity) as total_purchases 
      FROM purchases GROUP BY base_id, equipment_type_id
    ) p ON p.base_id = b.id AND p.equipment_type_id = et.id
    LEFT JOIN (
      SELECT destination_base_id as base_id, equipment_type_id, SUM(quantity) as total_transfers_in 
      FROM transfers GROUP BY destination_base_id, equipment_type_id
    ) ti ON ti.base_id = b.id AND ti.equipment_type_id = et.id
    LEFT JOIN (
      SELECT source_base_id as base_id, equipment_type_id, SUM(quantity) as total_transfers_out 
      FROM transfers GROUP BY source_base_id, equipment_type_id
    ) to_t ON to_t.base_id = b.id AND to_t.equipment_type_id = et.id
    LEFT JOIN (
      SELECT base_id, equipment_type_id, SUM(quantity) as total_assigned 
      FROM assignments GROUP BY base_id, equipment_type_id
    ) a ON a.base_id = b.id AND a.equipment_type_id = et.id
    LEFT JOIN (
      SELECT base_id, equipment_type_id, SUM(quantity) as total_expended 
      FROM expenditures GROUP BY base_id, equipment_type_id
    ) e ON e.base_id = b.id AND e.equipment_type_id = et.id
    ${baseId ? 'WHERE b.id = ' + parseInt(baseId, 10) : ''}
    ORDER BY b.name, et.category, et.name;
  `;

  const inventoryRes = await db.query(inventoryQuery);

  return {
    metrics: {
      openingBalance,
      purchases,
      transfersIn,
      transfersOut,
      netMovement,
      assigned,
      expended,
      closingBalance,
    },
    filtersApplied: {
      baseId: baseId ? Number(baseId) : null,
      equipmentTypeId: equipmentTypeId ? Number(equipmentTypeId) : null,
      startDate: startDate || null,
      endDate: endDate || null,
    },
    inventory: inventoryRes.rows,
  };
};

module.exports = {
  getAvailableStock,
  getDashboardMetrics,
};
