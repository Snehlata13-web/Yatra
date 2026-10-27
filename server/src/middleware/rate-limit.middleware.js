const { rateLimit } = require('express-rate-limit');

const positiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const apiRateLimiter = rateLimit({
    windowMs: positiveNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    limit: positiveNumber(process.env.RATE_LIMIT_MAX, 100),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later'
        });
    }
});

module.exports = {
    apiRateLimiter
};
