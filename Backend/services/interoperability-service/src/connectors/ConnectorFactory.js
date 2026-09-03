const GovernmentRestConnector = require('./GovernmentRestConnector');

class ConnectorFactory {
    static getConnector(config) {
        switch (config.type) {
            case 'GOVERNMENT_REST':
                return new GovernmentRestConnector(config);
            default:
                throw new Error(`Unsupported connector type: ${config.type}`);
        }
    }
}

module.exports = ConnectorFactory;
