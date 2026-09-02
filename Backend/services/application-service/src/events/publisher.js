const kafka = require('../config/kafka');
const crypto = require('crypto');

const producer = kafka.producer();

let isConnected = false;

const connectProducer = async () => {
    try {
        await producer.connect();
        isConnected = true;
        console.log('Kafka Producer connected');
    } catch (err) {
        console.error('Failed to connect Kafka producer:', err);
    }
};

connectProducer();

const publishEvent = async (eventType, applicationId, serviceId, applicantId) => {
    if (!isConnected) {
        console.error('Cannot publish event, producer not connected');
        return;
    }

    const event = {
        eventId: crypto.randomUUID(),
        eventType,
        applicationId,
        serviceId,
        applicantId,
        timestamp: new Date().toISOString(),
        schemaVersion: '1.0'
    };

    try {
        await producer.send({
            topic: 'application.events',
            messages: [
                { value: JSON.stringify(event) }
            ]
        });
        console.log(`Published event ${eventType} for application ${applicationId}`);
    } catch (err) {
        console.error('Error publishing event:', err);
    }
};

module.exports = {
    publishEvent
};
