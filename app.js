const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xssFilters = require('xss-filters');
const morgan = require('morgan');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/AppError');

const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

dotenv.config({ path: './.env' });

// 1. Set secure HTTP headers
app.use(helmet());

// 2. Restrict Cross-Origin Resource Sharing (CORS)
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    })
);

// 3. Rate limiting (max 100 requests per 15 mins per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// 4. Body parser with payload size limit (prevents large-payload DoS)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. XSS Input Sanitization middleware
app.use((req, res, next) => {
    if (req.body) {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xssFilters.inHTMLData(req.body[key]);
            }
        }
    }
    next();
});

// 6. HTTP request logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Health check route
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/forms', formRoutes);

// 404 route handler
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
