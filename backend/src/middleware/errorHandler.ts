import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/** Central error handler — never leaks stack traces or DB internals to clients. */
export function errorHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, message: "Duplicate entry: already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ success: false, message: "Invalid reference: related record not found" });
    }
  }

  if (typeof err?.status === "number" && err?.message) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  // eslint-disable-next-line no-console
  console.error("[placeprep:error]", err?.message ?? err);
  return res.status(500).json({ success: false, message: "Internal server error" });
}

/** 404 for unknown /api routes. */
export function notFound(_req: Request, res: Response) {
  return res.status(404).json({ success: false, message: "Route not found" });
}
