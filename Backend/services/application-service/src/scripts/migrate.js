const pool = require('../config/db');

async function migrate() {
    console.log('Starting migrations for application_db...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                department VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS workflow_definitions (
                id SERIAL PRIMARY KEY,
                service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
                version INTEGER NOT NULL DEFAULT 1,
                UNIQUE (service_id, version)
            );

            CREATE TABLE IF NOT EXISTS workflow_steps (
                id SERIAL PRIMARY KEY,
                workflow_id INTEGER REFERENCES workflow_definitions(id) ON DELETE CASCADE,
                step_order INTEGER NOT NULL,
                state_name VARCHAR(50) NOT NULL,
                required_role VARCHAR(50),
                UNIQUE (workflow_id, step_order)
            );

            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                service_id INTEGER REFERENCES services(id),
                applicant_id INTEGER NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
                submitted_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS application_status_history (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL,
                notes TEXT,
                changed_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS application_tasks (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                step_name VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            );
        `);
        console.log('Migrations completed successfully.');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

migrate();
