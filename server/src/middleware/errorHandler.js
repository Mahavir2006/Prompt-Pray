// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.path}:`, err.message);

    const status = err.statusCode || 500;
    const response = {
        error: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    res.status(status).json(response);
};

// Not found handler
export const notFoundHandler = (req, res) => {
    res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
};

// Custom error class
export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
