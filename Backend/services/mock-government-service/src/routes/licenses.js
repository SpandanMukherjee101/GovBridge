const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');

router.get('/:licenseId', licenseController.getLicense);
router.post('/', licenseController.createLicense);

module.exports = router;
