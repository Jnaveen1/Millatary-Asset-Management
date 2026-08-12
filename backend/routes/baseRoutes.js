const express = require('express');
const router = express.Router();
const baseController = require('../controllers/baseController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, baseController.getBases);

module.exports = router;
