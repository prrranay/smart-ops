import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let code = StatusCodes.INTERNAL_SERVER_ERROR;
  let status = 'error';
  let msg = 'Internal Server Error';
  let details: unknown = null;
  let isOp = false;

  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  if (err instanceof AppError) {
    code = err.statusCode;
    status = err.status;
    msg = err.message;
    details = err.details;
    isOp = err.isOperational;
  }
  else if (err instanceof ZodError) {
    code = StatusCodes.BAD_REQUEST;
    status = 'fail';
    msg = 'Validation failed';
    isOp = true;
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    isOp = true;
    switch (err.code) {
      case 'P2002':
        code = StatusCodes.CONFLICT;
        status = 'fail';
        const fields = (err.meta?.target as string[]) || [];
        msg = `Duplicate field value: ${fields.join(', ')}. Please use another value.`;
        break;
      case 'P2025':
        code = StatusCodes.NOT_FOUND;
        status = 'fail';
        msg = err.meta?.cause as string || 'Resource not found';
        break;
      default:
        isOp = false;
        code = StatusCodes.INTERNAL_SERVER_ERROR;
        status = 'error';
        msg = 'Database operation failed';
        break;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
      code = StatusCodes.BAD_REQUEST;
      status = 'fail';
      msg = 'Database validation error';
      isOp = true;
  }

  // response format
  const out: Record<string, unknown> = {
    status,
    message: msg,
  };

  if (details) {
    out.details = details;
  }

  if (env.NODE_ENV === 'development' && !isOp) {
    out.stack = err.stack;
  }

  // console.log("error middleware output:", out);
  res.status(code).json(out);
};
