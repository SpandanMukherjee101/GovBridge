const express = require('express');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        service: "identity-service",
        status: "ok"
    });
});

// Routes
app.use('/', authRoutes);

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
