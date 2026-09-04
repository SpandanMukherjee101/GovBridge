const pool = require('../config/db');
const ConnectorFactory = require('../connectors/ConnectorFactory');

exports.listConnectors = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT id, name, type, base_url, timeout, status, enabled, updated_at FROM connectors');
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        next(err);
    }
};

exports.getConnectorHealth = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM connectors WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' });
        
        const connectorConfig = result.rows[0];
        const connector = ConnectorFactory.getConnector(connectorConfig);
        
        const isHealthy = await connector.healthCheck();
        
        res.json({
            status: 'success',
            data: {
                id: connectorConfig.id,
                name: connectorConfig.name,
                enabled: connectorConfig.enabled,
                isHealthy,
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getDataRequestStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT dr.id, dr.application_id, dr.target_system, dr.status, dr.retry_count, dr.created_at, res.normalized_data 
             FROM data_requests dr 
             LEFT JOIN data_responses res ON dr.id = res.data_request_id 
             WHERE dr.id = $1`, 
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' });

        res.json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

exports.listDataRequests = async (req, res, next) => {
    try {
        const { applicationId } = req.query;
        let query = `SELECT id, application_id, target_system, status, retry_count, created_at, updated_at 
                     FROM data_requests WHERE 1=1`;
        const params = [];
        let paramIndex = 1;

        if (applicationId) {
            query += ` AND application_id = $${paramIndex++}`;
            params.push(applicationId);
        }

        const result = await pool.query(query, params);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        next(err);
    }
};
