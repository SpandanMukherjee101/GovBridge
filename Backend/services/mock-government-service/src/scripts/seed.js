require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: 'government_db',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: 5432,
});

async function seed() {
    try {
        console.log('Starting data seed for government_db...');

        // Clear existing data
        await pool.query('DELETE FROM business_licenses;');
        await pool.query('DELETE FROM tax_records;');
        await pool.query('DELETE FROM properties;');
        await pool.query('DELETE FROM citizens;');

        // Insert Citizens
        await pool.query(`
            INSERT INTO citizens (government_id, full_name, date_of_birth, address, phone) VALUES
            ('GOV-1001', 'Alice Smith', '1980-05-15', '123 Main St, Springfield', '555-0101'),
            ('GOV-1002', 'Bob Johnson', '1975-10-22', '456 Elm St, Shelbyville', '555-0202'),
            ('GOV-1003', 'Charlie Brown', '1990-01-30', '789 Oak Ave, Capital City', '555-0303')
        `);
        console.log('Citizens seeded.');

        // Insert Properties
        await pool.query(`
            INSERT INTO properties (property_id, owner_government_id, address, ownership_status, property_type) VALUES
            ('PROP-001', 'GOV-1001', '123 Main St, Springfield', 'ACTIVE', 'RESIDENTIAL'),
            ('PROP-002', 'GOV-1002', '456 Elm St, Shelbyville', 'ACTIVE', 'COMMERCIAL'),
            ('PROP-003', 'GOV-1001', '999 Pine Ln, Springfield', 'SOLD', 'RESIDENTIAL')
        `);
        console.log('Properties seeded.');

        // Insert Tax Records
        await pool.query(`
            INSERT INTO tax_records (taxpayer_id, government_id, tax_year, tax_status, outstanding_amount) VALUES
            ('TAX-A101', 'GOV-1001', 2025, 'CLEARED', 0.00),
            ('TAX-B202', 'GOV-1002', 2025, 'PENDING', 450.50),
            ('TAX-C303', 'GOV-1003', 2025, 'CLEARED', 0.00)
        `);
        console.log('Tax records seeded.');

        // Insert Business Licenses
        await pool.query(`
            INSERT INTO business_licenses (license_id, government_id, business_name, status, issued_at, expires_at) VALUES
            ('LIC-9001', 'GOV-1002', 'Bob Building Co', 'ACTIVE', '2024-01-01', '2026-12-31'),
            ('LIC-9002', 'GOV-1003', 'Charlie Tech Solutions', 'EXPIRED', '2020-01-01', '2021-12-31')
        `);
        console.log('Business licenses seeded.');

        console.log('Data seeding completed successfully.');
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await pool.end();
    }
}

seed();
