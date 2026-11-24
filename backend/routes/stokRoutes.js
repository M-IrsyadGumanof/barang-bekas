const express = require('express');
const router = express.Router();
const stokController = require('../controllers/stokController');
const { verifyToken, requirePemilik } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requirePemilik, stokController.getAllStok);
router.put('/adjust', verifyToken, requirePemilik, stokController.adjustStok);

module.exports = router;

