const pool = require('../config/db');
const { publishEvent } = require('../events/publisher');
const auditService = require('../services/auditService');

exports.createConsentRequest = async (req, res, next) => {
    try {
        const { applicationId, applicantId, requestingDepartment, sourceSystem, purpose, scopes, expiresAt } = req.body;
        
        // Basic validation
        if (!applicationId || !applicantId || !requestingDepartment || !sourceSystem || !purpose || !scopes || !expiresAt) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        }

        const result = await pool.query(
            `INSERT INTO consents (application_id, applicant_id, requesting_department, source_system, purpose, scopes, status, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7) RETURNING *`,
            [applicationId, applicantId, requestingDepartment, sourceSystem, purpose, scopes, expiresAt]
        );
        
        const consent = result.rows[0];
        
        // Audit
        await auditService.logAudit('SYSTEM', 'CONSENT_REQUESTED', 'consents', consent.id, purpose, requestingDepartment, sourceSystem, applicationId);
        
        res.status(201).json({ success: true, data: consent });
    } catch (err) {
        next(err);
    }
};

exports.listConsents = async (req, res, next) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM consents WHERE applicant_id = $1';
        const params = [req.user.userId];
        
        if (status) {
            query += ' AND status = $2';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
};

exports.getConsent = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM consents WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Consent not found' } });
        }
        
        const consent = result.rows[0];
        
        if (consent.applicant_id !== req.user.userId && req.user.role !== 'OFFICER' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to view this consent' } });
        }
        
        res.json({ success: true, data: consent });
    } catch (err) {
        next(err);
    }
};

exports.grantConsent = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM consents WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Consent not found' } });
        }
        
        const consent = result.rows[0];
        
        if (consent.applicant_id !== req.user.userId) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the applicant can grant consent' } });
        }
        
        if (consent.status !== 'PENDING') {
            return res.status(400).json({ success: false, error: { code: 'CONSENT_INVALID_STATE', message: 'Only PENDING consent can be granted' } });
        }
        
        if (new Date(consent.expires_at) < new Date()) {
            return res.status(400).json({ success: false, error: { code: 'CONSENT_EXPIRED', message: 'Consent request has expired' } });
        }
        
        const updateResult = await pool.query(
            `UPDATE consents SET status = 'ACTIVE', granted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        
        const updatedConsent = updateResult.rows[0];
        
        await publishEvent('CONSENT_GRANTED', updatedConsent.application_id, updatedConsent.source_system, { consentId: updatedConsent.id }, 'consent.events');
        await auditService.logAudit(req.user.userId, 'CONSENT_GRANTED', 'consents', updatedConsent.id, updatedConsent.purpose, updatedConsent.requesting_department, updatedConsent.source_system, updatedConsent.application_id);
        
        res.json({ success: true, data: updatedConsent });
    } catch (err) {
        next(err);
    }
};

exports.rejectConsent = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const result = await pool.query('SELECT * FROM consents WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Consent not found' } });
        }
        
        const consent = result.rows[0];
        
        if (consent.applicant_id !== req.user.userId) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the applicant can reject consent' } });
        }
        
        if (consent.status !== 'PENDING') {
            return res.status(400).json({ success: false, error: { code: 'CONSENT_INVALID_STATE', message: 'Only PENDING consent can be rejected' } });
        }
        
        const updateResult = await pool.query(
            `UPDATE consents SET status = 'REJECTED', rejected_at = CURRENT_TIMESTAMP, rejection_reason = $2 WHERE id = $1 RETURNING *`,
            [req.params.id, reason || null]
        );
        
        const updatedConsent = updateResult.rows[0];
        
        await publishEvent('CONSENT_REJECTED', updatedConsent.application_id, updatedConsent.source_system, { consentId: updatedConsent.id, reason }, 'consent.events');
        await auditService.logAudit(req.user.userId, 'CONSENT_REJECTED', 'consents', updatedConsent.id, updatedConsent.purpose, updatedConsent.requesting_department, updatedConsent.source_system, updatedConsent.application_id);
        
        res.json({ success: true, data: updatedConsent });
    } catch (err) {
        next(err);
    }
};

exports.revokeConsent = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM consents WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Consent not found' } });
        }
        
        const consent = result.rows[0];
        
        if (consent.applicant_id !== req.user.userId) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the applicant can revoke consent' } });
        }
        
        if (consent.status !== 'ACTIVE') {
            return res.status(400).json({ success: false, error: { code: 'CONSENT_INVALID_STATE', message: 'Only ACTIVE consent can be revoked' } });
        }
        
        const updateResult = await pool.query(
            `UPDATE consents SET status = 'REVOKED', revoked_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        
        const updatedConsent = updateResult.rows[0];
        
        await publishEvent('CONSENT_REVOKED', updatedConsent.application_id, updatedConsent.source_system, { consentId: updatedConsent.id }, 'consent.events');
        await auditService.logAudit(req.user.userId, 'CONSENT_REVOKED', 'consents', updatedConsent.id, updatedConsent.purpose, updatedConsent.requesting_department, updatedConsent.source_system, updatedConsent.application_id);
        
        res.json({ success: true, data: updatedConsent });
    } catch (err) {
        next(err);
    }
};
