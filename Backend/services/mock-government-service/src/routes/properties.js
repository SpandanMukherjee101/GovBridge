const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

router.get('/:propertyId', propertyController.getProperty);

module.exports = router;
