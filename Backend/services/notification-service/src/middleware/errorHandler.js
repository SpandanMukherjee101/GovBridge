exports.errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
};
