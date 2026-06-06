import { PrismaClient, Prisma } from '@prisma/client';
import { env } from './env.config';
import { logger } from '../utils/logger';

// Prevent multiple instances of Prisma Client in development hot reloading
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

  // Bind database query logs to winston in development
  if (env.NODE_ENV === 'development') {
    client.$on('query' as never, (e: Prisma.QueryEvent) => {
      logger.debug(`[Prisma Query] ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
    });
  }

  client.$on('error' as never, (e: Prisma.LogEvent) => {
    logger.error(`[Prisma Error] ${e.message}`);
  });

  client.$on('info' as never, (e: Prisma.LogEvent) => {
    logger.info(`[Prisma Info] ${e.message}`);
  });

  client.$on('warn' as never, (e: Prisma.LogEvent) => {
    logger.warn(`[Prisma Warning] ${e.message}`);
  });

  return client;
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
