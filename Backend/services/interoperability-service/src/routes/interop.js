const express = require('express');
const connectorController = require('../controllers/connectorController');
const consentController = require('../controllers/consentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/connectors', authMiddleware, connectorController.listConnectors);
router.get('/connectors/:id/health', connectorController.getConnectorHealth);

// Consent Routes
router.post('/consents/requests', authMiddleware, consentController.createConsentRequest);
router.get('/consents', authMiddleware, consentController.listConsents);
router.get('/consents/:id', authMiddleware, consentController.getConsent);
router.post('/consents/:id/grant', authMiddleware, consentController.grantConsent);
router.post('/consents/:id/reject', authMiddleware, consentController.rejectConsent);
router.post('/consents/:id/revoke', authMiddleware, consentController.revokeConsent);

router.get('/data-requests/:id', authMiddleware, connectorController.getDataRequestStatus);
router.get('/data-requests', authMiddleware, connectorController.listDataRequests);

module.exports = router;
