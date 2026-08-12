const assignmentService = require('../services/assignmentService');

const createAssignment = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, quantity, assignedTo, assignmentDate } = req.body;
    const assignment = await assignmentService.executeAssignment({
      baseId,
      equipmentTypeId,
      quantity,
      assignedTo,
      assignmentDate,
      createdBy: req.user.userId,
    });
    res.status(201).json({
      message: 'Asset assigned successfully',
      assignment,
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

const getAssignments = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId } = req.query;
    const assignments = await assignmentService.getAssignments({ baseId, equipmentTypeId });
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
};
