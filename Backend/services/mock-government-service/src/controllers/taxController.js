const pool = require('../config/db');

exports.getTaxRecord = async (req, res, next) => {
    try {
        const { taxpayerId } = req.params;

        const result = await pool.query('SELECT * FROM tax_records WHERE taxpayer_id = $1', [taxpayerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ ERROR: 'RECORD_NOT_FOUND' });
        }

        const tax = result.rows[0];

        // Intentionally UPPERCASE to simulate legacy mainframe
        res.json({
            TAXPAYER_ID: tax.taxpayer_id,
            GOVERNMENT_ID: tax.government_id,
            TAX_YEAR: tax.tax_year,
            TAX_STATUS: tax.tax_status,
            OUTSTANDING_BAL: tax.outstanding_amount
        });
    } catch (err) {
        next(err);
    }
};
