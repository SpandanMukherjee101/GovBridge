const express = require('express');
const dotenv = require('dotenv');
const pool = require('./config/db');
const redisClient = require('./config/redis');
const kafkaConfig = require('./config/kafka');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        service: "identity-service",
        status: "ok"
    });
});

const server = app.listen(port, () => {
    console.log(`identity-service running on port ${port}`);
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
