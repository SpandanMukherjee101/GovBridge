const pool = require('../config/db');

async function seed() {
    console.log('Starting data seed for interop_db...');
    try {
        await pool.query('TRUNCATE audit_logs, data_responses, data_requests, entity_identifiers, entities, consents, connector_endpoints, connectors RESTART IDENTITY CASCADE');

        // Connectors
        const conn1 = await pool.query(
            "INSERT INTO connectors (name, type, base_url) VALUES ('PROPERTY_REGISTRY', 'GOVERNMENT_REST', 'http://mock-government-service:3005/government/properties') RETURNING id"
        );
        const conn2 = await pool.query(
            "INSERT INTO connectors (name, type, base_url) VALUES ('TAX_SYSTEM', 'GOVERNMENT_REST', 'http://mock-government-service:3005/government/tax') RETURNING id"
        );
        const conn3 = await pool.query(
            "INSERT INTO connectors (name, type, base_url) VALUES ('LICENSING_SYSTEM', 'GOVERNMENT_REST', 'http://mock-government-service:3005/government/licenses') RETURNING id"
        );

        // Connector Endpoints
        await pool.query("INSERT INTO connector_endpoints (connector_id, action, path) VALUES ($1, 'FETCH', '/:id')", [conn1.rows[0].id]);
        await pool.query("INSERT INTO connector_endpoints (connector_id, action, path) VALUES ($1, 'FETCH', '/:id')", [conn2.rows[0].id]);
        await pool.query("INSERT INTO connector_endpoints (connector_id, action, path) VALUES ($1, 'FETCH', '/:id')", [conn3.rows[0].id]);

        // Entity for Applicant 1 (the test Citizen)
        const entRes = await pool.query("INSERT INTO entities (canonical_id, type, applicant_id) VALUES ('ENT-1001', 'PERSON', 1) RETURNING id");
        const entId = entRes.rows[0].id;

        // Identifiers
        await pool.query("INSERT INTO entity_identifiers (entity_id, source_system, external_identifier) VALUES ($1, 'PROPERTY_REGISTRY', 'PROP-001')", [entId]);
        await pool.query("INSERT INTO entity_identifiers (entity_id, source_system, external_identifier) VALUES ($1, 'TAX_SYSTEM', 'TAX-A101')", [entId]);

        // Consent
        await pool.query(
            "INSERT INTO consents (application_id, applicant_id, requesting_department, source_system, purpose, scopes, status, expires_at, granted_at) VALUES ('APP-1001', 1, 'DEPT-LICENSING', 'MULTIPLE', 'Business License Verification', ARRAY['PROPERTY_READ', 'TAX_READ'], 'ACTIVE', '2030-12-31', CURRENT_TIMESTAMP)"
        );

        console.log('Seeded interoperability data correctly.');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await pool.end();
    }
}

seed();
