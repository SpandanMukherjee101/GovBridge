require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: 'government_db',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: 5432,
});

async function migrate() {
    try {
        console.log('Starting migrations for government_db...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS citizens (
                id SERIAL PRIMARY KEY,
                government_id VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                date_of_birth DATE NOT NULL,
                address TEXT,
                phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Citizens table ready.');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                property_id VARCHAR(50) UNIQUE NOT NULL,
                owner_government_id VARCHAR(50) NOT NULL REFERENCES citizens(government_id),
                address TEXT NOT NULL,
                ownership_status VARCHAR(50) NOT NULL,
                property_type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Properties table ready.');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tax_records (
                id SERIAL PRIMARY KEY,
                taxpayer_id VARCHAR(50) UNIQUE NOT NULL,
                government_id VARCHAR(50) NOT NULL REFERENCES citizens(government_id),
                tax_year INT NOT NULL,
                tax_status VARCHAR(50) NOT NULL,
                outstanding_amount DECIMAL(15,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tax_records table ready.');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS business_licenses (
                id SERIAL PRIMARY KEY,
                license_id VARCHAR(50) UNIQUE NOT NULL,
                government_id VARCHAR(50) NOT NULL REFERENCES citizens(government_id),
                business_name VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL,
                issued_at DATE NOT NULL,
                expires_at DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Business_licenses table ready.');
        
        console.log('Migrations completed successfully.');
    } catch (err) {
        console.error('Error running migrations:', err);
    } finally {
        await pool.end();
    }
}

migrate();
