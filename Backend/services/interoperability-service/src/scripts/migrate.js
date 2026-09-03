const pool = require('../config/db');

async function migrate() {
    console.log('Starting migrations for interop_db...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS connectors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                base_url VARCHAR(255) NOT NULL,
                timeout INTEGER DEFAULT 5000,
                status VARCHAR(50) DEFAULT 'ACTIVE',
                enabled BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS connector_endpoints (
                id SERIAL PRIMARY KEY,
                connector_id INTEGER REFERENCES connectors(id) ON DELETE CASCADE,
                action VARCHAR(100) NOT NULL,
                path VARCHAR(255) NOT NULL,
                method VARCHAR(10) DEFAULT 'GET'
            );

            DROP TABLE IF EXISTS consents CASCADE;
            DROP TABLE IF EXISTS consent_requests CASCADE;

            CREATE TABLE IF NOT EXISTS consents (
                id SERIAL PRIMARY KEY,
                application_id VARCHAR(100) NOT NULL,
                applicant_id INTEGER NOT NULL,
                requesting_department VARCHAR(100) NOT NULL,
                source_system VARCHAR(100) NOT NULL,
                purpose TEXT,
                scopes TEXT[],
                status VARCHAR(50) DEFAULT 'PENDING',
                expires_at TIMESTAMP,
                granted_at TIMESTAMP,
                revoked_at TIMESTAMP,
                rejected_at TIMESTAMP,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS entities (
                id SERIAL PRIMARY KEY,
                canonical_id VARCHAR(100) UNIQUE NOT NULL,
                type VARCHAR(50) NOT NULL,
                applicant_id INTEGER UNIQUE
            );

            CREATE TABLE IF NOT EXISTS entity_identifiers (
                id SERIAL PRIMARY KEY,
                entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
                source_system VARCHAR(100) NOT NULL,
                external_identifier VARCHAR(255) NOT NULL,
                UNIQUE(source_system, external_identifier)
            );

            CREATE TABLE IF NOT EXISTS data_requests (
                id SERIAL PRIMARY KEY,
                application_id INTEGER,
                target_system VARCHAR(100) NOT NULL,
                status VARCHAR(50) DEFAULT 'CREATED',
                retry_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS data_responses (
                id SERIAL PRIMARY KEY,
                data_request_id INTEGER REFERENCES data_requests(id) ON DELETE CASCADE,
                normalized_data JSONB,
                received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                actor VARCHAR(255),
                action VARCHAR(100) NOT NULL,
                resource VARCHAR(100),
                resource_id VARCHAR(255),
                purpose TEXT,
                source_system VARCHAR(100),
                target_system VARCHAR(100),
                request_id VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_consents_applicant_id ON consents(applicant_id);
            CREATE INDEX IF NOT EXISTS idx_data_requests_application_id ON data_requests(application_id);
        `);
        console.log('Migrations completed successfully.');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

migrate();
