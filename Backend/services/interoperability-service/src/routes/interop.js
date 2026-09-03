const express = require('express');
const connectorController = require('../controllers/connectorController');
const consentController = require('../controllers/consentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/connectors', authMiddleware, connectorController.listConnectors);
router.get('/connectors/:id/health', authMiddleware, connectorController.getConnectorHealth);

router.get('/consents', authMiddleware, consentController.listConsents);

router.get('/data-requests/:id', authMiddleware, connectorController.getDataRequestStatus);

module.exports = router;
