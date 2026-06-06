import winston from 'winston';
import path from 'path';

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Determine the environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Custom format for local development console logs
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Standard JSON format for production logs
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define log transports
const transports: winston.transport[] = [];

if (isDevelopment) {
  // Local development console logging
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: developmentFormat,
    })
  );
} else {
  // Production console logging (JSON format)
  transports.push(
    new winston.transports.Console({
      level: 'info',
      format: productionFormat,
    })
  );

  // File logging (JSON format)
  const logDir = path.join(process.cwd(), 'logs');
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: productionFormat,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      level: 'info',
      format: productionFormat,
    })
  );
}

// Create the winston logger instance
export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  levels,
  transports,
  // Catch unhandled exceptions and promise rejections
  exceptionHandlers: isDevelopment
    ? [new winston.transports.Console({ format: developmentFormat })]
    : [
        new winston.transports.Console({ format: productionFormat }),
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
          format: productionFormat,
        }),
      ],
  rejectionHandlers: isDevelopment
    ? [new winston.transports.Console({ format: developmentFormat })]
    : [
        new winston.transports.Console({ format: productionFormat }),
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'rejections.log'),
          format: productionFormat,
        }),
      ],
  exitOnError: false,
});
