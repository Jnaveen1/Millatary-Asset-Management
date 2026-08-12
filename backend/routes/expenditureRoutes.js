const express = require('express');
const router = express.Router();
const expenditureController = require('../controllers/expenditureController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles, enforceBaseAccess } = require('../middlewares/rbacMiddleware');

router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), enforceBaseAccess, expenditureController.createExpenditure);
router.get('/', authenticateToken, enforceBaseAccess, expenditureController.getExpenditures);

module.exports = router;
