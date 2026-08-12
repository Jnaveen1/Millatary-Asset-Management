const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles, enforceBaseAccess } = require('../middlewares/rbacMiddleware');

router.post('/', authenticateToken, authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'), enforceBaseAccess, purchaseController.createPurchase);
router.get('/', authenticateToken, enforceBaseAccess, purchaseController.getPurchases);

module.exports = router;
