const app = require('./app');
const pool = require('./config/db');
const redisClient = require('./config/redis');
const { startConsumer, stopConsumer } = require('./consumers/eventConsumer');

const port = process.env.PORT || 3004;

const server = app.listen(port, async () => {
    console.log(`notification-service running on port ${port}`);
    await startConsumer();
});

// Graceful Shutdown
const shutdown = async () => {
    console.log('SIGTERM/SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
    await stopConsumer();
    await pool.end();
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
