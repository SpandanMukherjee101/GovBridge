const app = require('./app');
const pool = require('./config/db');
const redisClient = require('./config/redis');

const port = process.env.PORT || 3002;

const server = app.listen(port, () => {
    console.log(`application-service running on port ${port}`);
});

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
