const purchaseService = require('../services/purchaseService');

const createPurchase = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, quantity, purchaseDate } = req.body;
    const purchase = await purchaseService.executePurchase({
      baseId,
      equipmentTypeId,
      quantity,
      purchaseDate,
      createdBy: req.user.userId,
    });
    res.status(201).json({
      message: 'Purchase recorded successfully',
      purchase,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

const getPurchases = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId } = req.query;
    const purchases = await purchaseService.getPurchases({ baseId, equipmentTypeId });
    res.json(purchases);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPurchase,
  getPurchases,
};
