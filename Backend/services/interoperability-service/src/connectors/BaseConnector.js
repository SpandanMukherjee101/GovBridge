class BaseConnector {
    constructor(config) {
        this.config = config;
    }

    async authenticate() {
        throw new Error('Not implemented');
    }

    async getData(externalIdentifier) {
        throw new Error('Not implemented');
    }

    async sendData(data) {
        throw new Error('Not implemented');
    }

    async healthCheck() {
        throw new Error('Not implemented');
    }
}

module.exports = BaseConnector;
