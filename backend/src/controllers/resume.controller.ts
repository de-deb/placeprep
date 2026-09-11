import type { Request, Response } from "express";
import { resumeService } from "../services/resume.service";
import {
  achievementSchema,
  certificationSchema,
  experienceSchema,
  projectSchema,
  resumeSchema,
} from "../validations/schemas";
import { asyncHandler } from "../middleware/asyncHandler";
import { ok } from "../utils/responses";

const nestedSchemas = {
  experience: experienceSchema,
  project: projectSchema,
  achievement: achievementSchema,
  certification: certificationSchema,
} as const;

type NestedKind = keyof typeof nestedSchemas;

function kind(req: Request): NestedKind {
  const k = req.params.kind as NestedKind;
  if (!nestedSchemas[k]) {
    const e = new Error("Unknown resume section") as Error & { status: number };
    e.status = 404;
    throw e;
  }
  return k;
}

export const getResume = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await resumeService.full(req.user!.id));
});

export const updateResume = asyncHandler(async (req: Request, res: Response) => {
  const input = resumeSchema.parse(req.body);
  return ok(res, await resumeService.update(req.user!.id, input));
});

export const addResumeEntry = asyncHandler(async (req: Request, res: Response) => {
  const k = kind(req);
  const input = nestedSchemas[k].parse(req.body);
  const resume = await resumeService.getOrCreate(req.user!.id);
  const clean = Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, v]) => [key, v === "" ? null : v])
  );
  return ok(res, await resumeService.nested(k).create(req.user!.id, resume.id, clean), 201);
});

export const updateResumeEntry = asyncHandler(async (req: Request, res: Response) => {
  const k = kind(req);
  const input = nestedSchemas[k].partial().parse(req.body);
  return ok(res, await resumeService.nested(k).update(req.user!.id, req.params.id, input as Record<string, unknown>));
});

export const deleteResumeEntry = asyncHandler(async (req: Request, res: Response) => {
  const k = kind(req);
  return ok(res, await resumeService.nested(k).remove(req.user!.id, req.params.id));
});
