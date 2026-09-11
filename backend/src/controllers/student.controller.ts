import type { Request, Response } from "express";
import { profileService } from "../services/profile.service";
import { dashboardService } from "../services/dashboard.service";
import { profileSchema } from "../validations/schemas";
import { asyncHandler } from "../middleware/asyncHandler";
import { ok } from "../utils/responses";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await profileService.get(req.user!.id);
  return ok(res, profile);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = profileSchema.parse(req.body);
  const profile = await profileService.update(req.user!.id, input);
  return ok(res, profile);
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getForUser(req.user!.id);
  return ok(res, data);
});
