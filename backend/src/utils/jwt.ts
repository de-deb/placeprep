import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  sub: string; // user id
  role: "STUDENT" | "ADMIN";
}

export function signToken(payload: JwtPayload): string {
  // jsonwebtoken types accept string; env value like "7d" is valid.
  return jwt.sign(payload, env.jwtSecret as string, {
    expiresIn: env.jwtExpiresIn as unknown as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret as string) as JwtPayload;
}
