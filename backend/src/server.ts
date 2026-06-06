import http from 'http';
import app from './app';
import { env } from './config/env.config';
import { prisma } from './config/db.config';
import { logger } from './utils/logger';

let server: http.Server;

async function bootstrap() {
  try {
    logger.info('Connecting to DB...');
    await prisma.$connect();
    logger.info('DB connection ok.');

    server = app.listen(env.PORT, () => {
        logger.info(`Server started in ${env.NODE_ENV} on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error('failed to bootstrap app:', err);
    process.exit(1);
  }
}

// shutdown helper
const shutdown = async (sig: string) => {
  logger.warn(`Received ${sig}. shutting down...`);
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server stopped.');
    });
  }

  try {
    await prisma.$disconnect();
    logger.info('DB connection closed.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (r) => {
  logger.error('Unhandled Rejection:', r);
  process.exit(1);
});

bootstrap();
