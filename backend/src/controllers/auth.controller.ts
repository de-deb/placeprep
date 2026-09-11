import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { loginSchema, registerSchema } from "../validations/schemas";
import { asyncHandler } from "../middleware/asyncHandler";
import { created, ok } from "../utils/responses";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  return created(res, result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input.email, input.password);
  return ok(res, result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.me(req.user!.id);
  return ok(res, user);
});
