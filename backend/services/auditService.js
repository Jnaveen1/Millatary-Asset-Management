const db = require('../config/db');

const logAction = async (userId, action, details, client = db) => {
  const res = await client.query(
    `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3) RETURNING *`,
    [userId, action, typeof details === 'string' ? details : JSON.stringify(details)]
  );
  return res.rows[0];
};

const getAuditLogs = async ({ action, userId, userRole, userBaseId, limit = 100 }) => {
  let queryText = `
    SELECT 
      al.id,
      al.user_id,
      u.username,
      u.role,
      b.name as base_name,
      al.action,
      al.details,
      al.created_at
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    LEFT JOIN bases b ON u.base_id = b.id
  `;

  const whereClauses = [];
  const params = [];

  if (action) {
    params.push(action);
    whereClauses.push(`al.action = $${params.length}`);
  }

  if (userId) {
    params.push(userId);
    whereClauses.push(`al.user_id = $${params.length}`);
  }

  if (userRole === 'BASE_COMMANDER' && userBaseId) {
    params.push(userBaseId);
    whereClauses.push(`(u.base_id = $${params.length} OR al.details->>'baseId' = $${params.length} OR al.details->>'sourceBaseId' = $${params.length} OR al.details->>'destinationBaseId' = $${params.length})`);
  }

  if (whereClauses.length > 0) {
    queryText += ' WHERE ' + whereClauses.join(' AND ');
  }

  const limitVal = parseInt(limit, 10) || 100;
  queryText += ` ORDER BY al.created_at DESC, al.id DESC LIMIT ${limitVal}`;

  const result = await db.query(queryText, params);
  return result.rows;
};

module.exports = {
  logAction,
  getAuditLogs,
};
