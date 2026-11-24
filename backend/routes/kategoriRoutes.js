const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');
const { verifyToken, requirePemilik } = require('../middleware/authMiddleware');

router.get('/', verifyToken, kategoriController.getAll);
router.post('/', verifyToken, requirePemilik, kategoriController.create);
router.put('/:id', verifyToken, requirePemilik, kategoriController.update);
router.delete('/:id', verifyToken, requirePemilik, kategoriController.remove);

module.exports = router;

