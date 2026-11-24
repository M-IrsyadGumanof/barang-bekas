const express = require('express');
const router = express.Router();
const penjualanController = require('../controllers/transaksiPenjualanController');
const { verifyToken, requirePemilik } = require('../middleware/authMiddleware');

router.use(verifyToken, requirePemilik);

router.post('/', penjualanController.create);
router.get('/', penjualanController.getAll);
router.get('/:id', penjualanController.getById);

module.exports = router;

