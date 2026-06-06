import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly details: unknown;

  constructor(statusCode: number, message: string, isOperational = true, details: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.details = details;

    // Capture stack trace, excluding this constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details: unknown = null) {
    super(StatusCodes.BAD_REQUEST, message, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(StatusCodes.UNAUTHORIZED, message, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(StatusCodes.FORBIDDEN, message, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(StatusCodes.NOT_FOUND, message, true);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(StatusCodes.CONFLICT, message, true);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details: unknown = null) {
    super(StatusCodes.BAD_REQUEST, message, true, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', isOperational = false) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, message, isOperational);
  }
}
