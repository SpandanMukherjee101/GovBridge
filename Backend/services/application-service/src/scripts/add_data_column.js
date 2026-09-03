const pool = require('../config/db');

async function addDataColumn() {
    console.log('Adding data column to applications table...');
    try {
        await pool.query(`
            ALTER TABLE applications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
        `);
        console.log('Successfully added data column.');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await pool.end();
    }
}

addDataColumn();
