import morgan from 'morgan';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';

const stream: morgan.StreamOptions = {
  write: (msg) => logger.http(msg.trim()),
};

const skip = () => {
  return env.NODE_ENV === 'test';
};

const format = () => {
  return env.NODE_ENV === 'production'
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
    : ':method :url :status :res[content-length] - :response-time ms';
};

export const loggingMiddleware = morgan(format(), { stream, skip });
