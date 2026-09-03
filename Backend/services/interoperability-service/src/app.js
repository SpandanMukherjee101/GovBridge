const express = require('express');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        service: "interoperability-service",
        status: "ok"
    });
});

const interopRoutes = require('./routes/interop');
app.use('/', interopRoutes);

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
