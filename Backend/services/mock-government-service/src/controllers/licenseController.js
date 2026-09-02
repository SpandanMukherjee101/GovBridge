const pool = require('../config/db');

exports.getLicense = async (req, res, next) => {
    try {
        const { licenseId } = req.params;

        const result = await pool.query('SELECT * FROM business_licenses WHERE license_id = $1', [licenseId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'License not found'
            });
        }

        const license = result.rows[0];

        // Standard RESTful format
        res.json({
            status: 'success',
            data: {
                licenseId: license.license_id,
                governmentId: license.government_id,
                businessName: license.business_name,
                licenseStatus: license.status,
                issuedAt: license.issued_at instanceof Date ? license.issued_at.toISOString().split('T')[0] : license.issued_at,
                expiresAt: license.expires_at instanceof Date ? license.expires_at.toISOString().split('T')[0] : license.expires_at
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.createLicense = async (req, res, next) => {
    try {
        const { governmentId, businessName, issuedAt, expiresAt } = req.body;

        if (!governmentId || !businessName || !issuedAt || !expiresAt) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields'
            });
        }

        // Idempotency check: prevent accidental retries by checking for an exact match
        const existing = await pool.query(`
            SELECT * FROM business_licenses 
            WHERE government_id = $1 
              AND business_name = $2 
              AND issued_at = $3 
              AND expires_at = $4
        `, [governmentId, businessName, issuedAt, expiresAt]);

        if (existing.rows.length > 0) {
            const license = existing.rows[0];
            return res.status(200).json({
                status: 'success',
                message: 'Returned existing license (idempotent)',
                data: {
                    licenseId: license.license_id,
                    governmentId: license.government_id,
                    businessName: license.business_name,
                    licenseStatus: license.status,
                    issuedAt: license.issued_at instanceof Date ? license.issued_at.toISOString().split('T')[0] : license.issued_at,
                    expiresAt: license.expires_at instanceof Date ? license.expires_at.toISOString().split('T')[0] : license.expires_at
                }
            });
        }

        const licenseId = 'LIC-' + Math.floor(Math.random() * 100000);

        const result = await pool.query(`
            INSERT INTO business_licenses (license_id, government_id, business_name, status, issued_at, expires_at)
            VALUES ($1, $2, $3, 'ACTIVE', $4, $5)
            RETURNING *
        `, [licenseId, governmentId, businessName, issuedAt, expiresAt]);

        const license = result.rows[0];

        res.status(201).json({
            status: 'success',
            data: {
                licenseId: license.license_id,
                governmentId: license.government_id,
                businessName: license.business_name,
                licenseStatus: license.status,
                issuedAt: license.issued_at instanceof Date ? license.issued_at.toISOString().split('T')[0] : license.issued_at,
                expiresAt: license.expires_at instanceof Date ? license.expires_at.toISOString().split('T')[0] : license.expires_at
            }
        });
    } catch (err) {
        next(err);
    }
};
