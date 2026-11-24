const express = require('express');
const router = express.Router();
const pembelianController = require('../controllers/transaksiPembelianController');
const { verifyToken, requirePemilik } = require('../middleware/authMiddleware');

// Pemilik membuat dan melihat semua transaksi
router.post('/', verifyToken, requirePemilik, pembelianController.create);
router.get('/', verifyToken, requirePemilik, pembelianController.getAll);

// Pemasok melihat riwayat miliknya sendiri (FR-33)
router.get('/riwayat-saya', verifyToken, pembelianController.getRiwayatPemasok);

// Detail transaksi (diproteksi hak milik jika peran Pemasok)
router.get('/:id', verifyToken, pembelianController.getById);

module.exports = router;

