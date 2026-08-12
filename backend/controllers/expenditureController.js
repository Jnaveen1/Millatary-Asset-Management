const expenditureService = require('../services/expenditureService');

const createExpenditure = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, quantity, reason, expenditureDate } = req.body;
    const expenditure = await expenditureService.executeExpenditure({
      baseId,
      equipmentTypeId,
      quantity,
      reason,
      expenditureDate,
      createdBy: req.user.userId,
    });
    res.status(201).json({
      message: 'Asset expenditure logged successfully',
      expenditure,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
        availableStock: error.availableStock,
        requestedQuantity: error.requestedQuantity,
      });
    }
    next(error);
  }
};

const getExpenditures = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId } = req.query;
    const expenditures = await expenditureService.getExpenditures({ baseId, equipmentTypeId });
    res.json(expenditures);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpenditure,
  getExpenditures,
};
