const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles, enforceBaseAccess } = require('../middlewares/rbacMiddleware');

router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), enforceBaseAccess, assignmentController.createAssignment);
router.get('/', authenticateToken, enforceBaseAccess, assignmentController.getAssignments);

module.exports = router;
