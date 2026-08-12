const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles, enforceBaseAccess } = require('../middlewares/rbacMiddleware');

router.post('/', authenticateToken, authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'), enforceBaseAccess, transferController.createTransfer);
router.get('/', authenticateToken, enforceBaseAccess, transferController.getTransfers);

module.exports = router;
