class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        // Captures the stack trace without polluting it with the constructor call
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
