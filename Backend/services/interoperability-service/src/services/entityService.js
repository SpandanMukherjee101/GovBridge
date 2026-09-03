const pool = require('../config/db');

exports.resolveEntity = async (applicantId) => {
    const result = await pool.query(
        'SELECT canonical_id FROM entities WHERE applicant_id = $1',
        [applicantId]
    );
    if (result.rows.length === 0) {
        throw new Error('Entity not found for applicant');
    }
    return result.rows[0].canonical_id;
};

exports.resolveExternalIdentifier = async (canonicalId, sourceSystem) => {
    const result = await pool.query(
        `SELECT ei.external_identifier 
         FROM entity_identifiers ei 
         JOIN entities e ON ei.entity_id = e.id 
         WHERE e.canonical_id = $1 AND ei.source_system = $2`,
        [canonicalId, sourceSystem]
    );

    if (result.rows.length === 0) {
        throw new Error(`External identifier not found for ${canonicalId} in ${sourceSystem}`);
    }

    return result.rows[0].external_identifier;
};
