const pool = require('../config/db');

exports.getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        const mappedData = result.rows.map(n => ({
            ...n,
            is_read: n.read_at !== null
        }));
        res.json({ status: 'success', data: mappedData });
    } catch (err) {
        next(err);
    }
};

exports.getNotification = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Notification not found' });
        }
        
        res.json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL RETURNING *',
            [id, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Notification not found or already read' });
        }
        
        res.json({ status: 'success', data: { ...result.rows[0], is_read: true } });
    } catch (err) {
        next(err);
    }
};

exports.markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL RETURNING id',
            [userId]
        );
        
        res.json({ status: 'success', message: `${result.rowCount} notifications marked as read` });
    } catch (err) {
        next(err);
    }
};
