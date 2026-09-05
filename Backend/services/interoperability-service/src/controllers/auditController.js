const pool = require('../config/db');

exports.listAuditLogs = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
        res.json(result.rows);
    } catch (err) {
        console.error('Failed to fetch audit logs:', err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
