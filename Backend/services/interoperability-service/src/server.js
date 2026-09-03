const app = require('./app');
const pool = require('./config/db');
const redisClient = require('./config/redis');
const kafkaConsumer = require('./events/consumer');

const port = process.env.PORT || 3003;

const server = app.listen(port, () => {
    console.log(`interoperability-service running on port ${port}`);
});

// Start Kafka Consumer
kafkaConsumer.startConsumer().catch(console.error);

// Graceful Shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
    await pool.end();
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
    process.exit(0);
});
