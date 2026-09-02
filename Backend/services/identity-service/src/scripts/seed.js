const pool = require('../config/db');
const bcrypt = require('bcrypt');

const ROLES = ['CITIZEN', 'OFFICER', 'ADMIN'];
const PERMISSIONS = {
    CITIZEN: [
        'APPLICATION_CREATE',
        'APPLICATION_READ_OWN',
        'CONSENT_READ',
        'CONSENT_MANAGE',
        'NOTIFICATION_READ'
    ],
    OFFICER: [
        'APPLICATION_READ',
        'APPLICATION_UPDATE',
        'APPLICATION_APPROVE',
        'DATA_REQUEST_CREATE'
    ],
    ADMIN: [
        'USER_MANAGE',
        'DEPARTMENT_MANAGE',
        'CONNECTOR_MANAGE',
        'AUDIT_READ',
        'MONITORING_READ'
    ]
};

const USERS = [
    { email: 'citizen@govbridge.local', role: 'CITIZEN', department_id: null },
    { email: 'officer@govbridge.local', role: 'OFFICER', department_id: 'DEPT-LICENSING' },
    { email: 'admin@govbridge.local', role: 'ADMIN', department_id: null }
];

async function seed() {
    console.log('Starting data seed for identity_db...');
    try {
        // Clear existing data
        await pool.query('TRUNCATE refresh_tokens, user_roles, role_permissions, users, permissions, roles RESTART IDENTITY CASCADE');

        // Insert Roles
        for (const role of ROLES) {
            await pool.query('INSERT INTO roles (name, description) VALUES ($1, $2)', [role, `${role} Role`]);
        }
        console.log('Roles seeded.');

        // Insert Permissions and map to Roles
        for (const [roleName, perms] of Object.entries(PERMISSIONS)) {
            const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
            const roleId = roleRes.rows[0].id;

            for (const perm of perms) {
                // Ensure permission exists
                let permRes = await pool.query('SELECT id FROM permissions WHERE name = $1', [perm]);
                if (permRes.rows.length === 0) {
                    permRes = await pool.query('INSERT INTO permissions (name) VALUES ($1) RETURNING id', [perm]);
                }
                const permId = permRes.rows[0].id;

                // Map permission to role
                await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [roleId, permId]);
            }
        }
        console.log('Permissions and Role Mappings seeded.');

        // Insert Demo Users
        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        for (const u of USERS) {
            const userRes = await pool.query(
                'INSERT INTO users (email, password_hash, department_id) VALUES ($1, $2, $3) RETURNING id',
                [u.email, hashedPassword, u.department_id]
            );
            const userId = userRes.rows[0].id;

            const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [u.role]);
            const roleId = roleRes.rows[0].id;

            await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
        }
        console.log('Demo users seeded.');
        console.log('Data seeding completed successfully.');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await pool.end();
    }
}

seed();
