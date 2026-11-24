const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barangController');
const { verifyToken, requirePemilik } = require('../middleware/authMiddleware');

router.get('/', verifyToken, barangController.getAll);
router.post('/', verifyToken, requirePemilik, barangController.create);
router.put('/:id', verifyToken, requirePemilik, barangController.update);
router.delete('/:id', verifyToken, requirePemilik, barangController.remove);

module.exports = router;

