const pool = require('../config/db');

async function migrate() {
    console.log('Starting migrations for identity_db...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS permissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
                PRIMARY KEY (role_id, permission_id)
            );

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                department_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_roles (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, role_id)
            );

            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
        `);
        console.log('Migrations completed successfully.');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

migrate();
