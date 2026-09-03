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
            // Use the internal K8s service DNS to reach the mock-government-service directly
            const response = await axios.get('http://mock-government-service:3005/health', { timeout: 2000 });
            return response.status === 200;
        } catch (error) {
            console.error('Connector health check failed:', error.message);
            return false;
        }
    }
}

module.exports = GovernmentRestConnector;
