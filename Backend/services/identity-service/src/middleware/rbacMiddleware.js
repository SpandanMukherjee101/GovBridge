const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            return res.status(403).json({ status: 'error', message: 'Forbidden: Insufficient permissions' });
        }

        if (!req.user.permissions.includes(requiredPermission)) {
            return res.status(403).json({ status: 'error', message: `Forbidden: Requires permission ${requiredPermission}` });
        }

        next();
    };
};

module.exports = requirePermission;
