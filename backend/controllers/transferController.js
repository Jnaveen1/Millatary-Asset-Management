const transferService = require('../services/transferService');

const createTransfer = async (req, res, next) => {
  try {
    const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity, transferDate } = req.body;
    const transfer = await transferService.executeTransfer({
      sourceBaseId,
      destinationBaseId,
      equipmentTypeId,
      quantity,
      transferDate,
      initiatedBy: req.user.userId,
    });
    res.status(201).json({
      message: 'Cross-base asset transfer executed successfully',
      transfer,
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

const getTransfers = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId } = req.query;
    const transfers = await transferService.getTransfers({ baseId, equipmentTypeId });
    res.json(transfers);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransfer,
  getTransfers,
};
