const express = require('express');
const router = express.Router();
const hargaController = require('../controllers/hargaController');
const { verifyToken, requirePemilik } = require('../middleware/authMiddleware');

router.get('/history', verifyToken, hargaController.getHistory);
router.post('/', verifyToken, requirePemilik, hargaController.setNewPrice);

module.exports = router;

