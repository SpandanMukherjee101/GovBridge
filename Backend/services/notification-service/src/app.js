const express = require('express');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorHandler');
const notificationRoutes = require('./routes/notifications');

dotenv.config();

const app = express();

app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        service: "notification-service",
        status: "ok"
    });
});

app.use('/', notificationRoutes);

app.use(errorHandler);

module.exports = app;
