const pool = require('../config/db');

exports.getProperty = async (req, res, next) => {
    try {
        const { propertyId } = req.params;

        const result = await pool.query(`
            SELECT p.*, c.full_name 
            FROM properties p
            JOIN citizens c ON p.owner_government_id = c.government_id
            WHERE p.property_id = $1
        `, [propertyId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found' }); // Flat simple error
        }

        const property = result.rows[0];

        // Format intentionally flat with abbreviations
        res.json({
            prop_no: property.property_id,
            owner_name: property.full_name,
            owner_gov_id: property.owner_government_id,
            addr: property.address,
            ownership: property.ownership_status,
            type: property.property_type
        });
    } catch (err) {
        next(err);
    }
};
