import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./errorHandler.js";
import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function extractToken(req: Request): string | null {
  // Check Authorization Bearer header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check HttpOnly cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    next(new AppError("Authentication required. Please log in.", 401));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError("Invalid or expired session. Please log in again.", 401));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
  } catch {
    // If token is invalid, simply proceed as unauthenticated
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  requireAuth(req, _res, () => {
    if (req.user?.role !== Role.ADMIN) {
      return next(new AppError("Forbidden. Administrator privileges required.", 403));
    }
    next();
  });
}
