exports.normalizeProperty = (rawData, canonicalId) => {
    return {
        resourceType: 'PROPERTY_OWNERSHIP',
        entityId: canonicalId,
        propertyId: rawData.prop_no,
        owner: {
            name: rawData.owner_name,
            govId: rawData.owner_gov_id
        },
        ownershipStatus: rawData.ownership,
        source: {
            system: 'PROPERTY_REGISTRY'
        }
    };
};

exports.normalizeTax = (rawData, canonicalId) => {
    return {
        resourceType: 'TAX_CLEARANCE',
        entityId: canonicalId,
        taxId: rawData.TAXPAYER_ID,
        taxPayer: {
            govId: rawData.GOVERNMENT_ID
        },
        clearanceStatus: rawData.TAX_STATUS,
        outstandingBalance: rawData.OUTSTANDING_BAL,
        source: {
            system: 'TAX_SYSTEM'
        }
    };
};

exports.normalize = (systemName, rawData, canonicalId) => {
    if (systemName === 'PROPERTY_REGISTRY') return exports.normalizeProperty(rawData, canonicalId);
    if (systemName === 'TAX_SYSTEM') return exports.normalizeTax(rawData, canonicalId);
    return rawData; // Fallback
};
