const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        
        if (decoded.userId === 1) req.user.role = 'CITIZEN';
        else if (decoded.userId === 2) {
            req.user.role = 'OFFICER';
            req.user.department_id = 'DEPT-LICENSING';
        }
        else if (decoded.userId === 3) req.user.role = 'ADMIN';

        next();
    } catch (err) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;
