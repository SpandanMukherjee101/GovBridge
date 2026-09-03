const kafka = require('../config/kafka');
const crypto = require('crypto');

const producer = kafka.producer();
let isConnected = false;

const connectProducer = async () => {
    try {
        await producer.connect();
        isConnected = true;
        console.log('Kafka Producer connected (interop)');
    } catch (err) {
        console.error('Failed to connect Kafka producer:', err);
    }
};

connectProducer();

exports.publishEvent = async (eventType, applicationId, targetSystem, payload) => {
    if (!isConnected) return;
    
    const event = {
        eventId: crypto.randomUUID(),
        eventType,
        applicationId,
        targetSystem,
        payload,
        timestamp: new Date().toISOString(),
        schemaVersion: '1.0'
    };

    try {
        await producer.send({
            topic: 'data.exchange.events',
            messages: [{ value: JSON.stringify(event) }]
        });
        console.log(`Published ${eventType} for App ${applicationId}`);
    } catch (err) {
        console.error('Error publishing event:', err);
    }
};
