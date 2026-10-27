const fs = require('node:fs');
const path = require('node:path');
const winston = require('winston');

const logDirectory = path.resolve(process.env.LOG_DIR || path.join(process.cwd(), 'logs'));
fs.mkdirSync(logDirectory, { recursive: true });

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: {
        service: 'yatra-server'
    },
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(logDirectory, 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(logDirectory, 'combined.log')
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logDirectory, 'exceptions.log')
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logDirectory, 'rejections.log')
        })
    ],
    exitOnError: false
});

const logError = (error, context = {}) => {
    logger.error(error instanceof Error ? error : String(error), context);
};

module.exports = {
    logger,
    logError
};