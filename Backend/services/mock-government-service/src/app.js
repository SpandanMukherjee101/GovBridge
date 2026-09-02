const express = require('express');
const simulateFailure = require('./middleware/simulateFailure');
const errorHandler = require('./middleware/errorHandler');

const citizenRoutes = require('./routes/citizens');
const propertyRoutes = require('./routes/properties');
const taxRoutes = require('./routes/tax');
const licenseRoutes = require('./routes/licenses');

const app = express();
app.use(express.json());

// Failure Simulation Middleware
app.use(simulateFailure);

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'mock-government-service', status: 'ok' });
});

// Routes
app.use('/government/citizens', citizenRoutes);
app.use('/government/properties', propertyRoutes);
app.use('/government/tax', taxRoutes);
app.use('/government/licenses', licenseRoutes);

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
