const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { enforceBaseAccess } = require('../middlewares/rbacMiddleware');

router.get('/dashboard', authenticateToken, enforceBaseAccess, assetController.getDashboardMetrics);

module.exports = router;
