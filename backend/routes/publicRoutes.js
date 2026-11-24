const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/prices', publicController.getPublicPriceList);
router.get('/verify/:token', publicController.verifyTransaction);

module.exports = router;

