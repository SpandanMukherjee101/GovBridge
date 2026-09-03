const kafka = require('../config/kafka');
const redisClient = require('../config/redis');
const orchestrator = require('../services/dataExchangeOrchestrator');

const consumer = kafka.consumer({ groupId: 'interoperability-group' });

exports.startConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'application.events', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const event = JSON.parse(message.value.toString());
                
                // Idempotency check via Redis (Atomic lock)
                const lockKey = `processed_event:${event.eventId}`;
                const acquired = await redisClient.set(lockKey, 'processing', { NX: true, EX: 300 });
                if (!acquired) {
                    console.log(`Event ${event.eventId} already processed or processing, skipping.`);
                    return;
                }

                if (event.eventType === 'APPLICATION_SUBMITTED') {
                    console.log(`Received APPLICATION_SUBMITTED for App ${event.applicationId}`);
                    
                    // For BUSINESS_LICENSE (Assume serviceId 1 maps to this requirements)
                    if (event.serviceId === 1) {
                        const requiredSystems = ['PROPERTY_REGISTRY', 'TAX_SYSTEM'];
                        try {
                            await orchestrator.runExchange(event.applicationId, event.applicantId, requiredSystems);
                        } catch (exchangeErr) {
                            // If exchange fails, we can release the lock so it can be retried if needed, or let it expire
                            await redisClient.del(lockKey);
                            throw exchangeErr;
                        }
                    }
                }

                // Mark event as processed durably
                await redisClient.setEx(lockKey, 86400, 'completed');

            } catch (err) {
                console.error('Error processing Kafka message:', err);
            }
        },
    });
    console.log('Kafka Consumer started for interoperability-service');
};
