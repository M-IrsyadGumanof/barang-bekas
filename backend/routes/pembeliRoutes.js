const express = require('express');
const router = express.Router();
const pembeliController = require('../controllers/pembeliController');
const { verifyToken, requirePemilik } = require('../middleware/authMiddleware');

router.use(verifyToken, requirePemilik);

router.get('/', pembeliController.getAll);
router.post('/', pembeliController.create);
router.put('/:id', pembeliController.update);
router.delete('/:id', pembeliController.remove);

module.exports = router;

