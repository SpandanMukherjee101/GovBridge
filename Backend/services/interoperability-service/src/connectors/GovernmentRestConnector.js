const BaseConnector = require('./BaseConnector');
const axios = require('axios');

class GovernmentRestConnector extends BaseConnector {
    constructor(config) {
        super(config);
        this.client = axios.create({
            baseURL: config.base_url,
            timeout: config.timeout || 5000
        });
    }

    async authenticate() {
        // Mock government service doesn't require explicit auth for the demo, 
        // but this is where an OAuth or API Key exchange would happen.
        return true;
    }

    async getData(externalIdentifier) {
        try {
            const response = await this.client.get(`/${externalIdentifier}`);
            return response.data;
        } catch (error) {
            throw new Error(`Government API Error: ${error.message}`);
        }
    }

    async healthCheck() {
        try {
            // Usually we'd hit /health, but we might not know the exact path for that specific connector.
            // Let's assume the base domain has a health check.
            const url = new URL(this.config.base_url);
            const healthUrl = `${url.protocol}//${url.host}/api/mock/health`;
            const response = await axios.get(healthUrl, { timeout: 2000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

module.exports = GovernmentRestConnector;
