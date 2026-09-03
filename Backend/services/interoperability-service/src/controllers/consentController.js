const pool = require('../config/db');

exports.listConsents = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM consents WHERE applicant_id = $1', [req.user.userId]);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        next(err);
    }
};
