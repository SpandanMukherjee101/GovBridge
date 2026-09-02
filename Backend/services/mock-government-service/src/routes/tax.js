const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');

router.get('/:taxpayerId', taxController.getTaxRecord);

module.exports = router;
