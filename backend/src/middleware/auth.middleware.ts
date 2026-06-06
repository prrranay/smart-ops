import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { UserRole } from '../types/role.enum';
import { UnauthorizedError, ForbiddenError } from '../utils/app-error';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  let tok = req.cookies?.accessToken;

  if (!tok) {
    const hdr = req.headers.authorization;
    if (hdr && hdr.startsWith('Bearer ')) {
      tok = hdr.split(' ')[1];
    }
  }

  if (!tok) {
    throw new UnauthorizedError('Authentication token missing or invalid');
  }

  try {
    const decoded = jwt.verify(tok, env.JWT_SECRET) as JwtPayload;
    
    // set req.user context
    req.user = decoded;
    
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Authentication failed: invalid token');
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

    next();
  };
};

// legacy roles wrapper
export const requireRoles = (roles: ('USER' | 'ADMIN' | 'MANAGER')[]) => {
  return authorize(roles as UserRole[]);
};
