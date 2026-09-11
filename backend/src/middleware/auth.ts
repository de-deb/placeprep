import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthUser {
  id: string;
  role: "STUDENT" | "ADMIN";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Requires `Authorization: Bearer <jwt>`. */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

/** Requires one of the given roles (use after `authenticate`). */
export function authorize(...roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: admin access required" });
    }
    return next();
  };
}
