const express = require('express');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');
const applicationRoutes = require('./routes/applications');

dotenv.config();

const app = express();
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        service: "application-service",
        status: "ok"
    });
});

// Routes
app.use('/', applicationRoutes);

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
