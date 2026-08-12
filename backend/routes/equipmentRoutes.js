const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, equipmentController.getEquipmentTypes);

module.exports = router;
