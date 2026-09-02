const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const requirePermission = require('../middleware/rbacMiddleware');

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login requests per windowMs
    message: { status: 'error', message: 'Too many login attempts, please try again later' }
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);

// Dummy protected endpoints for RBAC testing
router.get('/test-citizen', authMiddleware, requirePermission('APPLICATION_CREATE'), (req, res) => {
    res.json({ status: 'success', message: 'You have CITIZEN permissions!' });
});

router.get('/test-officer', authMiddleware, requirePermission('APPLICATION_APPROVE'), (req, res) => {
    res.json({ status: 'success', message: 'You have OFFICER permissions!' });
});

router.get('/test-admin', authMiddleware, requirePermission('USER_MANAGE'), (req, res) => {
    res.json({ status: 'success', message: 'You have ADMIN permissions!' });
});

module.exports = router;
