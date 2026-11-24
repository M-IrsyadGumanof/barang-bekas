const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requirePemilik, requirePemasok } = require('../middleware/authMiddleware');

router.get('/pemilik', verifyToken, requirePemilik, dashboardController.getPemilikDashboard);
router.get('/pemasok', verifyToken, requirePemasok, dashboardController.getPemasokDashboard);

module.exports = router;

