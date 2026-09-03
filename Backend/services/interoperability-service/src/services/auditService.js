const pool = require('../config/db');

exports.logAudit = async (actor, action, resource, resourceId, purpose, sourceSystem, targetSystem, requestId) => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (actor, action, resource, resource_id, purpose, source_system, target_system, request_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [actor, action, resource, resourceId, purpose, sourceSystem, targetSystem, requestId]
        );
        console.log(`[AUDIT] Action: ${action} on ${resource} (${resourceId}) by ${actor}`);
    } catch (err) {
        console.error('Failed to write audit log:', err);
    }
};
