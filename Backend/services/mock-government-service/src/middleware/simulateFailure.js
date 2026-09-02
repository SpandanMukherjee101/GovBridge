const simulateFailure = (req, res, next) => {
    const simulate = req.query.simulate;

    if (!simulate) {
        return next();
    }

    if (simulate === '500') {
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Simulated 500 error from external government service.'
        });
    }

    if (simulate === '404') {
        return res.status(404).json({
            error: 'Not Found',
            message: 'Simulated 404 error from external government service.'
        });
    }

    if (simulate === 'timeout') {
        // Delay for 5 seconds to simulate a timeout
        console.log('Simulating timeout delay (5s)...');
        return setTimeout(() => {
            next();
        }, 5000);
    }

    next();
};

module.exports = simulateFailure;
