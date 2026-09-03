const kafka = require('../config/kafka');
const redisClient = require('../config/redis');
const orchestrator = require('../services/dataExchangeOrchestrator');

const consumer = kafka.consumer({ groupId: 'interoperability-group' });

exports.startConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'application.events', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const event = JSON.parse(message.value.toString());
                
                // Idempotency check via Redis
                const processed = await redisClient.get(`processed_event:${event.eventId}`);
                if (processed) {
                    console.log(`Event ${event.eventId} already processed, skipping.`);
                    return;
                }

                if (event.eventType === 'APPLICATION_SUBMITTED') {
                    console.log(`Received APPLICATION_SUBMITTED for App ${event.applicationId}`);
                    
                    // For BUSINESS_LICENSE (Assume serviceId 1 maps to this requirements)
                    if (event.serviceId === 1) {
                        const requiredSystems = ['PROPERTY_REGISTRY', 'TAX_SYSTEM'];
                        // We run this asynchronously so we don't block the Kafka consumer loop completely,
                        // but normally we might await it if we want strict ordering.
                        orchestrator.runExchange(event.applicationId, event.applicantId, requiredSystems).catch(console.error);
                    }
                }

                // Mark event as processed
                await redisClient.setEx(`processed_event:${event.eventId}`, 86400, 'true');

            } catch (err) {
                console.error('Error processing Kafka message:', err);
            }
        },
    });
    console.log('Kafka Consumer started for interoperability-service');
};
