const pool = require('../config/db');
const redisClient = require('../config/redis');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';
const JWT_EXPIRES_IN = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

// Helper to generate a random string for refresh token
const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

exports.register = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }

        // Check if user exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ status: 'error', message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query('BEGIN');
        
        // Insert user
        const userRes = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
            [email, hashedPassword]
        );
        const user = userRes.rows[0];

        // Assign default CITIZEN role
        const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', ['CITIZEN']);
        if (roleRes.rows.length > 0) {
            await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user.id, roleRes.rows[0].id]);
        }

        await pool.query('COMMIT');

        res.status(201).json({
            status: 'success',
            data: { id: user.id, email: user.email, role: 'CITIZEN' }
        });
    } catch (err) {
        await pool.query('ROLLBACK');
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }

        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        // Fetch user's role
        const roleRes = await pool.query(
            `SELECT r.name as role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 LIMIT 1`,
            [user.id]
        );
        const role = roleRes.rows.length > 0 ? roleRes.rows[0].role_name : 'CITIZEN';

        // Generate tokens
        const jti = crypto.randomUUID();
        const accessToken = jwt.sign({ userId: user.id, role, department_id: user.department_id || null, jti }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = generateRefreshToken();

        // Store refresh token in DB
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, expiresAt]
        );

        res.json({
            status: 'success',
            data: {
                accessToken,
                refreshToken,
                user: { id: user.id, email: user.email, department_id: user.department_id }
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ status: 'error', message: 'Refresh token is required' });
        }

        const tokenRes = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
        if (tokenRes.rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
        }

        const tokenData = tokenRes.rows[0];
        if (new Date() > new Date(tokenData.expires_at)) {
            await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
            return res.status(401).json({ status: 'error', message: 'Refresh token expired' });
        }

        // Fetch user's role for the refreshed token
        const userRes = await pool.query('SELECT department_id FROM users WHERE id = $1', [tokenData.user_id]);
        const roleRes = await pool.query(
            `SELECT r.name as role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 LIMIT 1`,
            [tokenData.user_id]
        );
        const role = roleRes.rows.length > 0 ? roleRes.rows[0].role_name : 'CITIZEN';
        const dept = userRes.rows.length > 0 ? userRes.rows[0].department_id : null;

        // Issue new access token
        const jti = crypto.randomUUID();
        const accessToken = jwt.sign({ userId: tokenData.user_id, role, department_id: dept, jti }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const newRefreshToken = generateRefreshToken();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

        // Replace old refresh token with new one (rotation)
        await pool.query(
            'UPDATE refresh_tokens SET token = $1, expires_at = $2 WHERE id = $3',
            [newRefreshToken, expiresAt, tokenData.id]
        );

        res.json({
            status: 'success',
            data: { accessToken, refreshToken: newRefreshToken }
        });
    } catch (err) {
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const authHeader = req.headers.authorization;
        
        // Revoke refresh token
        if (refreshToken) {
            await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
        }

        // Blacklist access token in Redis
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.decode(token); // decode without verify since it might be expired anyway
                if (decoded && decoded.jti && decoded.exp) {
                    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
                    if (expiresIn > 0) {
                        // Store jti in redis with expiry
                        await redisClient.setEx(`bl_${decoded.jti}`, expiresIn, 'true');
                    }
                }
            } catch (e) {
                // Ignore invalid token formats on logout
            }
        }

        res.json({ status: 'success', message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        res.json({
            status: 'success',
            data: {
                user: req.user
            }
        });
    } catch (err) {
        next(err);
    }
};
