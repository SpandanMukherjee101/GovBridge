const pool = require('../config/db');
const entityService = require('./entityService');
const normalizationService = require('./normalizationService');
const auditService = require('./auditService');
const ConnectorFactory = require('../connectors/ConnectorFactory');

// Utility to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.runExchange = async (applicationId, applicantId, requiredSystems) => {
    console.log(`Starting data exchange for App ${applicationId}, Applicant ${applicantId}`);
    
    try {
        const canonicalId = await entityService.resolveEntity(applicantId);
        console.log(`Resolved to canonical entity: ${canonicalId}`);

        // For demo: verify consent
        const consentRes = await pool.query(
            "SELECT * FROM consents WHERE applicant_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()",
            [applicantId]
        );
        
        if (consentRes.rows.length === 0) {
            throw new Error('No active consent found for applicant');
        }
        console.log(`Consent verified for applicant ${applicantId}`);

        for (const targetSystem of requiredSystems) {
            await executeSingleExchange(applicationId, canonicalId, targetSystem);
        }
        
    } catch (error) {
        console.error('Data exchange orchestrator failed:', error);
    }
};

async function executeSingleExchange(applicationId, canonicalId, targetSystem) {
    // Create data request record
    const drRes = await pool.query(
        "INSERT INTO data_requests (application_id, target_system) VALUES ($1, $2) RETURNING id",
        [applicationId, targetSystem]
    );
    const dataRequestId = drRes.rows[0].id;

    try {
        const externalId = await entityService.resolveExternalIdentifier(canonicalId, targetSystem);
        console.log(`Resolved external ID for ${targetSystem}: ${externalId}`);

        const connectorRes = await pool.query("SELECT * FROM connectors WHERE name = $1 AND enabled = TRUE", [targetSystem]);
        if (connectorRes.rows.length === 0) throw new Error(`Connector ${targetSystem} not found or disabled`);
        
        const connectorConfig = connectorRes.rows[0];
        const connector = ConnectorFactory.getConnector(connectorConfig);
        
        let attempt = 0;
        let maxAttempts = 3;
        let delays = [1000, 2000, 4000]; // 1s, 2s, 4s
        let success = false;
        let rawData = null;

        while (attempt < maxAttempts && !success) {
            try {
                if (attempt > 0) {
                    console.log(`Retrying ${targetSystem} (Attempt ${attempt + 1})...`);
                }
                rawData = await connector.getData(externalId);
                success = true;
            } catch (err) {
                attempt++;
                await pool.query("UPDATE data_requests SET retry_count = $1 WHERE id = $2", [attempt, dataRequestId]);
                if (attempt < maxAttempts) {
                    await sleep(delays[attempt - 1]);
                } else {
                    throw err;
                }
            }
        }

        const normalizedData = normalizationService.normalize(targetSystem, rawData, canonicalId);

        await pool.query(
            "INSERT INTO data_responses (data_request_id, normalized_data) VALUES ($1, $2)",
            [dataRequestId, JSON.stringify(normalizedData)]
        );

        await pool.query("UPDATE data_requests SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1", [dataRequestId]);
        
        await auditService.logAudit(
            'SYSTEM', 
            'DATA_ACCESSED', 
            targetSystem, 
            externalId, 
            'Application Verification', 
            targetSystem, 
            'GovBridge', 
            dataRequestId
        );

        const { publishEvent } = require('../events/publisher');
        publishEvent('DATA_RECEIVED', applicationId, targetSystem, normalizedData);

    } catch (error) {
        console.error(`Exchange failed for ${targetSystem}:`, error.message);
        await pool.query("UPDATE data_requests SET status = 'FAILED', updated_at = NOW() WHERE id = $1", [dataRequestId]);
        await auditService.logAudit('SYSTEM', 'DATA_EXCHANGE_FAILED', targetSystem, '', 'Application Verification', targetSystem, 'GovBridge', dataRequestId);
        
        const { publishEvent } = require('../events/publisher');
        publishEvent('DATA_EXCHANGE_FAILED', applicationId, targetSystem, { error: error.message });
    }
}
