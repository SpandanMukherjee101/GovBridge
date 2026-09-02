const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizenController');

router.get('/:governmentId', citizenController.getCitizen);

module.exports = router;
