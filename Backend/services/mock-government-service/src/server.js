require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const port = process.env.PORT || 3005;

const server = app.listen(port, () => {
    console.log(`mock-government-service running on port ${port}`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
    await pool.end();
    process.exit(0);
});
