const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if token is blacklisted in Redis
        const isBlacklisted = await redisClient.get(`bl_${decoded.jti}`);
        if (isBlacklisted) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized: Token revoked' });
        }

        // Fetch user roles and permissions
        const userRes = await pool.query(`
            SELECT u.id, u.email, u.department_id, r.name as role_name
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.id = $1
        `, [decoded.userId]);

        if (userRes.rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized: User not found' });
        }

        const roles = userRes.rows.map(row => row.role_name);
        
        // Fetch permissions
        const permRes = await pool.query(`
            SELECT p.name as permission_name
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = $1
        `, [decoded.userId]);

        const permissions = permRes.rows.map(row => row.permission_name);

        req.user = {
            id: userRes.rows[0].id,
            email: userRes.rows[0].email,
            department_id: userRes.rows[0].department_id,
            roles: roles,
            permissions: permissions
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'error', message: 'Unauthorized: Token expired' });
        }
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;
