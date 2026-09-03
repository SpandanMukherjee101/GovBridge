const pool = require('../config/db');

async function seed() {
    console.log('Starting data seed for application_db...');
    try {
        // Clear existing
        await pool.query('TRUNCATE workflow_steps, workflow_definitions, application_tasks, application_status_history, applications, services RESTART IDENTITY CASCADE');

        // Removed DEPT-LICENSING seeded service as requested

        console.log('Data seeding completed successfully.');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await pool.end();
    }
}

seed();
