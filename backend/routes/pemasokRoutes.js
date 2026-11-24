const express = require('express');
const router = express.Router();
const pemasokController = require('../controllers/pemasokController');
const { verifyToken, requirePemilik } = require('../middleware/authMiddleware');

router.use(verifyToken, requirePemilik);

router.get('/', pemasokController.getAll);
router.post('/', pemasokController.create);
router.put('/:id', pemasokController.update);
router.delete('/:id', pemasokController.remove);

module.exports = router;

