const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const { verifyToken, requirePemilik } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requirePemilik, laporanController.getLaporan);

module.exports = router;

