const auditService = require('../services/auditService');

const getAuditLogs = async (req, res, next) => {
  try {
    const { action, userId, limit } = req.query;
    const logs = await auditService.getAuditLogs({
      action,
      userId,
      userRole: req.user.role,
      userBaseId: req.user.baseId,
      limit,
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
