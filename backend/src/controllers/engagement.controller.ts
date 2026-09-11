import type { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { searchService } from "../services/search.service";
import { interviewService } from "../services/interview.service";
import { userService } from "../services/user.service";
import { changePasswordSchema, interviewProgressSchema, prefsSchema, updateAccountSchema } from "../validations/schemas";
import { asyncHandler } from "../middleware/asyncHandler";
import { created, ok } from "../utils/responses";
import { z } from "zod";

// Notifications
export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === "true";
  const [items, unread] = await Promise.all([
    notificationService.list(req.user!.id, unreadOnly),
    notificationService.unreadCount(req.user!.id),
  ]);
  return ok(res, { items, unread });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await notificationService.markRead(req.user!.id, req.params.id));
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAllRead(req.user!.id);
  return ok(res, { ok: true });
});

// Search
export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const { q } = z.object({ q: z.string().min(2).max(80) }).parse(req.query);
  return ok(res, await searchService.search(q, req.user!.id));
});

// Settings
export const updateAccount = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAccountSchema.parse(req.body);
  return ok(res, await userService.updateAccount(req.user!.id, input.name));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const input = changePasswordSchema.parse(req.body);
  return ok(res, await userService.changePassword(req.user!.id, input.currentPassword, input.newPassword));
});

export const getPrefs = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await userService.getPrefs(req.user!.id));
});

export const updatePrefs = asyncHandler(async (req: Request, res: Response) => {
  const input = prefsSchema.parse(req.body);
  return ok(res, await userService.updatePrefs(req.user!.id, input));
});

// Interview
export const listInterviewQuestions = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  return ok(
    res,
    await interviewService.list(
      req.user!.id,
      q.category as string | undefined,
      q.difficulty as string | undefined,
      q.search as string | undefined
    )
  );
});

export const setInterviewProgress = asyncHandler(async (req: Request, res: Response) => {
  const input = interviewProgressSchema.parse(req.body);
  return ok(res, await interviewService.setProgress(req.user!.id, req.params.id, input.status));
});

export const interviewSummary = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await interviewService.summary(req.user!.id));
});

export const interviewCategories = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, interviewService.categories());
});

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  // Admin-only helper (route-guarded) for manual notices.
  const input = z
    .object({ userId: z.string().min(1), title: z.string().min(1).max(160), message: z.string().min(1).max(1000), link: z.string().max(200).optional() })
    .parse(req.body);
  const n = await notificationService.notify({ ...input, type: "SYSTEM" });
  return created(res, n);
});
