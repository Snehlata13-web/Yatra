const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const positiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Behind Render/Cloudflare every request arrives from the proxy, so the real
// visitor IP must come from the proxy headers — otherwise all users share one limit.
const clientIp = (req) =>
    req.headers['cf-connecting-ip'] ||
    req.headers['true-client-ip'] ||
    req.ip;

const apiRateLimiter = rateLimit({
    windowMs: positiveNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    limit: positiveNumber(process.env.RATE_LIMIT_MAX, 100),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(String(clientIp(req))),
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