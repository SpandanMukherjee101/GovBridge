const kafka = require('../config/kafka');
const pool = require('../config/db');
const redisClient = require('../config/redis');

const consumer = kafka.consumer({ groupId: 'notification-group' });

// In-memory set for graceful shutdown tracking
const processingMessages = new Set();
let isShuttingDown = false;

const generateNotificationContent = (topic, eventType, data) => {
    switch (eventType) {
        case 'APPLICATION_SUBMITTED':
            return {
                title: 'Application Submitted',
                message: 'Your Business Licence application has been submitted.'
            };
        case 'CONSENT_REQUESTED':
            return {
                title: 'Consent Required',
                message: 'Additional government data consent is required for your application.'
            };
        case 'CONSENT_GRANTED':
            return {
                title: 'Consent Granted',
                message: 'Data access consent has been granted.'
            };
        case 'CONSENT_REVOKED':
            return {
                title: 'Consent Revoked',
                message: 'Data access consent has been revoked.'
            };
        case 'DATA_VERIFIED':
            // Technically DATA_RECEIVED in interoperability, but mapping it
            return {
                title: 'Data Verified',
                message: 'Property ownership or required information has been verified.'
            };
        case 'APPLICATION_APPROVED':
            return {
                title: 'Application Approved',
                message: 'Your Business Licence application has been approved.'
            };
        case 'APPLICATION_REJECTED':
            return {
                title: 'Application Rejected',
                message: 'Your Business Licence application has been rejected.'
            };
        case 'DATA_EXCHANGE_FAILED':
        case 'INTEGRATION_FAILED':
            return {
                title: 'System Delay',
                message: 'Verification with a government system is temporarily unavailable.'
            };
        default:
            return null; // Ignore unknown event types safely
    }
};

const handleMessage = async ({ topic, partition, message }) => {
    if (isShuttingDown) return;
    
    let eventData;
    try {
        eventData = JSON.parse(message.value.toString());
    } catch (err) {
        console.error('Failed to parse Kafka message:', err.message);
        return; // Avoid crashing on malformed message
    }

    const { eventId, eventType, applicationId, applicantId, payload } = eventData;
    if (!eventId || !eventType) {
        console.error('Invalid event format:', eventData);
        return;
    }

    const cacheKey = `processed_notification_event:${eventId}`;
    
    // 1. Fast idempotency check in Redis
    try {
        const alreadyProcessedInRedis = await redisClient.get(cacheKey);
        if (alreadyProcessedInRedis) {
            console.log(`[Idempotency] Event ${eventId} skipped (Redis)`);
            return;
        }
    } catch (err) {
        console.warn('Redis check failed, falling back to PostgreSQL:', err.message);
    }

    // 2. Durable idempotency check in PostgreSQL (Atomic Insert)
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Try to insert event ID to processed_events to guarantee durable deduplication
        try {
            await client.query('INSERT INTO processed_events (event_id) VALUES ($1)', [eventId]);
        } catch (err) {
            if (err.code === '23505') { // Unique violation
                console.log(`[Idempotency] Event ${eventId} skipped (PostgreSQL)`);
                await client.query('ROLLBACK');
                return;
            }
            throw err;
        }

        // Generate content
        const notificationContent = generateNotificationContent(topic, eventType, eventData);
        
        if (notificationContent) {
            // Find user_id from event data. Fallback to 1 for demo purposes if absent
            let userId = applicantId || eventData.userId || eventData.applicant_id || 1;

            await client.query(
                `INSERT INTO notifications (user_id, application_id, type, title, message) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, applicationId || null, eventType, notificationContent.title, notificationContent.message]
            );
            console.log(`Notification created for user ${userId}: ${notificationContent.title}`);
        } else {
            console.log(`Ignored unknown event type: ${eventType}`);
        }

        await client.query('COMMIT');
        
        // Cache success in Redis for faster future checks (24h expiry)
        try {
            await redisClient.setEx(cacheKey, 86400, '1');
        } catch (err) {
            // Ignore redis set errors as Postgres has durable state
        }
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error processing event:', err);
    } finally {
        client.release();
    }
};

const startConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'application.events', fromBeginning: false });
        await consumer.subscribe({ topic: 'consent.events', fromBeginning: false });
        await consumer.subscribe({ topic: 'data.exchange.events', fromBeginning: false });
        await consumer.subscribe({ topic: 'integration.events', fromBeginning: false });

        console.log('Notification Consumer started');

        await consumer.run({
            eachMessage: async (payload) => {
                const messageId = `${payload.topic}-${payload.partition}-${payload.message.offset}`;
                processingMessages.add(messageId);
                try {
                    await handleMessage(payload);
                } finally {
                    processingMessages.delete(messageId);
                }
            },
        });
    } catch (error) {
        console.error('Consumer error:', error);
    }
};

const stopConsumer = async () => {
    isShuttingDown = true;
    console.log('Shutting down consumer...');
    try {
        await consumer.disconnect();
        console.log('Consumer disconnected gracefully.');
    } catch (err) {
        console.error('Error disconnecting consumer:', err);
    }
};

module.exports = { startConsumer, stopConsumer };
