const pool = require('../config/db');
const { publishEvent } = require('../events/publisher');

// Helper for History
const addHistory = async (client, applicationId, status, notes, changedBy) => {
    await client.query(
        'INSERT INTO application_status_history (application_id, status, notes, changed_by) VALUES ($1, $2, $3, $4)',
        [applicationId, status, notes, changedBy]
    );
};

exports.listServices = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM services');
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        next(err);
    }
};

exports.getService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Service not found' });
        res.json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

exports.createApplication = async (req, res, next) => {
    try {
        const { serviceId } = req.body;
        if (!serviceId) return res.status(400).json({ status: 'error', message: 'serviceId is required' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                'INSERT INTO applications (service_id, applicant_id, status) VALUES ($1, $2, $3) RETURNING *',
                [serviceId, req.user.userId, 'DRAFT']
            );
            const app = result.rows[0];
            await addHistory(client, app.id, 'DRAFT', 'Application created', req.user.userId);
            await client.query('COMMIT');
            res.status(201).json({ status: 'success', data: app });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

exports.listApplications = async (req, res, next) => {
    try {
        let query = 'SELECT a.*, s.name as service_name FROM applications a JOIN services s ON a.service_id = s.id';
        let params = [];
        
        if (req.user.role === 'CITIZEN') {
            query += ' WHERE a.applicant_id = $1';
            params.push(req.user.userId);
        } else if (req.user.role === 'OFFICER') {
            query += ' WHERE s.department = $1 AND a.status != $2';
            params.push(req.user.department_id, 'DRAFT');
        } // ADMIN sees all

        const result = await pool.query(query, params);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        next(err);
    }
};

exports.getApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT a.*, s.name as service_name, s.department FROM applications a JOIN services s ON a.service_id = s.id WHERE a.id = $1',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' });
        
        const app = result.rows[0];

        // RBAC check
        if (req.user.role === 'CITIZEN' && app.applicant_id !== req.user.userId) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }
        if (req.user.role === 'OFFICER' && app.department !== req.user.department_id) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        res.json({ status: 'success', data: app });
    } catch (err) {
        next(err);
    }
};

exports.submitApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            
            const appRes = await client.query('SELECT * FROM applications WHERE id = $1 FOR UPDATE', [id]);
            if (appRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
            const app = appRes.rows[0];

            if (app.applicant_id !== req.user.userId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ status: 'error', message: 'Forbidden' });
            }

            // IDEMPOTENCY check
            if (app.status !== 'DRAFT') {
                await client.query('ROLLBACK');
                // Return 200 OK since it's already submitted
                return res.json({ status: 'success', message: 'Already submitted', data: app });
            }

            // Advance to SUBMITTED
            await client.query(
                'UPDATE applications SET status = $1, submitted_at = NOW(), updated_at = NOW() WHERE id = $2',
                ['SUBMITTED', id]
            );
            await addHistory(client, id, 'SUBMITTED', 'Application submitted by citizen', req.user.userId);

            // Fetch workflow to initialize DATA_COLLECTION
            const wfRes = await client.query('SELECT * FROM workflow_definitions WHERE service_id = $1', [app.service_id]);
            if (wfRes.rows.length > 0) {
                const wfId = wfRes.rows[0].id;
                const stepRes = await client.query('SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order ASC LIMIT 1', [wfId]);
                if (stepRes.rows.length > 0) {
                    const firstStep = stepRes.rows[0];
                    await client.query(
                        'INSERT INTO application_tasks (application_id, step_name) VALUES ($1, $2)',
                        [id, firstStep.state_name]
                    );
                }
            }

            await client.query('COMMIT');
            
            // Publish Event
            publishEvent('APPLICATION_SUBMITTED', app.id, app.service_id, app.applicant_id);

            res.json({ status: 'success', message: 'Application submitted successfully' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

exports.approveApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (req.user.role !== 'OFFICER' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ status: 'error', message: 'Forbidden: requires officer role' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const appRes = await client.query(
                'SELECT a.*, s.department FROM applications a JOIN services s ON a.service_id = s.id WHERE a.id = $1 FOR UPDATE',
                [id]
            );
            if (appRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
            const app = appRes.rows[0];

            if (req.user.role === 'OFFICER' && app.department !== req.user.department_id) {
                await client.query('ROLLBACK');
                return res.status(403).json({ status: 'error', message: 'Forbidden: wrong department' });
            }

            if (app.status === 'APPROVED' || app.status === 'REJECTED') {
                await client.query('ROLLBACK');
                return res.status(400).json({ status: 'error', message: 'Application is already finalized' });
            }

            await client.query('UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2', ['APPROVED', id]);
            await addHistory(client, id, 'APPROVED', 'Application approved by officer', req.user.userId);
            
            // Close active tasks
            await client.query("UPDATE application_tasks SET status = 'COMPLETED', completed_at = NOW() WHERE application_id = $1 AND status = 'PENDING'", [id]);

            await client.query('COMMIT');

            publishEvent('APPLICATION_APPROVED', app.id, app.service_id, app.applicant_id);

            res.json({ status: 'success', message: 'Application approved' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

exports.rejectApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        if (req.user.role !== 'OFFICER' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ status: 'error', message: 'Forbidden: requires officer role' });
        }

        if (!reason) {
            return res.status(400).json({ status: 'error', message: 'Rejection reason is required' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const appRes = await client.query(
                'SELECT a.*, s.department FROM applications a JOIN services s ON a.service_id = s.id WHERE a.id = $1 FOR UPDATE',
                [id]
            );
            if (appRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
            const app = appRes.rows[0];

            if (req.user.role === 'OFFICER' && app.department !== req.user.department_id) {
                await client.query('ROLLBACK');
                return res.status(403).json({ status: 'error', message: 'Forbidden: wrong department' });
            }

            if (app.status === 'APPROVED' || app.status === 'REJECTED') {
                await client.query('ROLLBACK');
                return res.status(400).json({ status: 'error', message: 'Application is already finalized' });
            }

            await client.query('UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2', ['REJECTED', id]);
            await addHistory(client, id, 'REJECTED', `Rejected: ${reason}`, req.user.userId);
            
            // Close active tasks
            await client.query("UPDATE application_tasks SET status = 'COMPLETED', completed_at = NOW() WHERE application_id = $1 AND status = 'PENDING'", [id]);

            await client.query('COMMIT');

            publishEvent('APPLICATION_REJECTED', app.id, app.service_id, app.applicant_id);

            res.json({ status: 'success', message: 'Application rejected' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

exports.getTimeline = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Security Check
        const appRes = await pool.query(
            'SELECT a.*, s.department FROM applications a JOIN services s ON a.service_id = s.id WHERE a.id = $1',
            [id]
        );
        if (appRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' });
        const app = appRes.rows[0];

        if (req.user.role === 'CITIZEN' && app.applicant_id !== req.user.userId) return res.status(403).json({ status: 'error', message: 'Forbidden' });
        if (req.user.role === 'OFFICER' && app.department !== req.user.department_id) return res.status(403).json({ status: 'error', message: 'Forbidden' });

        // Build Timeline
        const historyRes = await pool.query('SELECT status, notes, created_at as timestamp, \'status_change\' as type FROM application_status_history WHERE application_id = $1 ORDER BY created_at ASC', [id]);
        const tasksRes = await pool.query('SELECT step_name as status, \'Task \' || status as notes, created_at as timestamp, \'task\' as type FROM application_tasks WHERE application_id = $1 ORDER BY created_at ASC', [id]);

        const timeline = [...historyRes.rows, ...tasksRes.rows].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({ status: 'success', data: timeline });
    } catch (err) {
        next(err);
    }
};
