const express = require('express');
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/services', authMiddleware, applicationController.listServices);
router.get('/services/:id', authMiddleware, applicationController.getService);

router.post('/applications', authMiddleware, applicationController.createApplication);
router.get('/applications', authMiddleware, applicationController.listApplications);
router.get('/applications/:id', authMiddleware, applicationController.getApplication);

router.post('/applications/:id/submit', authMiddleware, applicationController.submitApplication);
router.post('/applications/:id/approve', authMiddleware, applicationController.approveApplication);
router.post('/applications/:id/reject', authMiddleware, applicationController.rejectApplication);

router.get('/applications/:id/timeline', authMiddleware, applicationController.getTimeline);

module.exports = router;
