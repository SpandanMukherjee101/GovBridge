const pool = require('../config/db');

async function seed() {
    console.log('Starting data seed for application_db...');
    try {
        // Clear existing
        await pool.query('TRUNCATE workflow_steps, workflow_definitions, application_tasks, application_status_history, applications, services RESTART IDENTITY CASCADE');

        // Insert Service
        const srvRes = await pool.query(
            'INSERT INTO services (name, department, code, description) VALUES ($1, $2, $3, $4) RETURNING id',
            ['Business Licence', 'DEPT-LICENSING', 'BUSINESS_LICENSE', 'Standard municipal business license application.']
        );
        const serviceId = srvRes.rows[0].id;
        console.log('Seeded service: BUSINESS_LICENSE');

        // Insert Workflow Definition
        const wfRes = await pool.query(
            'INSERT INTO workflow_definitions (service_id, version) VALUES ($1, $2) RETURNING id',
            [serviceId, 1]
        );
        const workflowId = wfRes.rows[0].id;

        // Insert Workflow Steps
        const steps = [
            { order: 1, state: 'DATA_COLLECTION', role: null }, // Handled automatically by interoperability
            { order: 2, state: 'UNDER_REVIEW', role: 'OFFICER' },
            { order: 3, state: 'APPROVED', role: 'OFFICER' },
            { order: 4, state: 'REJECTED', role: 'OFFICER' }
        ];

        for (const step of steps) {
            await pool.query(
                'INSERT INTO workflow_steps (workflow_id, step_order, state_name, required_role) VALUES ($1, $2, $3, $4)',
                [workflowId, step.order, step.state, step.role]
            );
        }
        console.log('Seeded workflow definitions and steps.');

        console.log('Data seeding completed successfully.');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await pool.end();
    }
}

seed();
