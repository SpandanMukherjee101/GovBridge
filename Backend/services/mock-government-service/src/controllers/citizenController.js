const pool = require('../config/db');

exports.getCitizen = async (req, res, next) => {
    try {
        const { governmentId } = req.params;

        const result = await pool.query('SELECT * FROM citizens WHERE government_id = $1', [governmentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: `Citizen with ID ${governmentId} not found`
            });
        }

        const citizen = result.rows[0];

        // Format intentionally nested to simulate weird legacy APIs
        res.json({
            data: {
                person: {
                    identity_number: citizen.government_id,
                    personal_details: {
                        name: citizen.full_name,
                        dob: citizen.date_of_birth,
                        contact: {
                            address: citizen.address,
                            phone: citizen.phone
                        }
                    },
                    meta: {
                        registered: citizen.created_at
                    }
                }
            }
        });
    } catch (err) {
        next(err);
    }
};
