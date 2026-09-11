import type { Response } from "express";

/** Consistent success envelope: { success: true, data } */
export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

/** Consistent created envelope */
export function created<T>(res: Response, data: T) {
  return ok(res, data, 201);
}
