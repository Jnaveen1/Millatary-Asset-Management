const inventoryService = require('../services/inventoryService');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;
    const data = await inventoryService.getDashboardMetrics({ baseId, equipmentTypeId, startDate, endDate });
    res.json(data);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  getAvailableStock: inventoryService.getAvailableStock,
  getDashboardMetrics,
};
