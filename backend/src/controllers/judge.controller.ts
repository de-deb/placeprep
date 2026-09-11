import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../config/db";
import { codeRunSchema, codeSubmitSchema, internalProblemSchema, testCaseSchema } from "../validations/schemas";
import { asyncHandler } from "../middleware/asyncHandler";
import { created, ok } from "../utils/responses";
import {
  dailyProblem,
  getSubmission,
  recommendedProblems,
  runCode,
  solveStreak,
  submissionHistory,
  submitCode,
} from "../services/execution/judge.service";

/** Execution guard: 30 runs+submits / 15 min per IP (plus provider-side limits). */
export const executeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many executions — try again in 15 minutes" },
});

export const runProblemCode = asyncHandler(async (req: Request, res: Response) => {
  const input = codeRunSchema.parse(req.body);
  return ok(res, await runCode(req.user!.id, req.params.id, input.language, input.code, input.stdin));
});

export const submitProblemCode = asyncHandler(async (req: Request, res: Response) => {
  const input = codeSubmitSchema.parse(req.body);
  return created(res, await submitCode(req.user!.id, req.params.id, input.language, input.code));
});

export const listSubmissions = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await submissionHistory(req.user!.id, req.params.id));
});

export const getSubmissionById = asyncHandler(async (req: Request, res: Response) => {
  const s = await getSubmission(req.user!.id, req.params.submissionId);
  // Never leak anything beyond the owner's own code + verdict.
  return ok(res, s);
});

export const listLanguages = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await prisma.codingLanguage.findMany({ where: { active: true }, orderBy: { code: "asc" } }));
});

export const getDailyProblem = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await dailyProblem(req.user!.id));
});

export const getRecommended = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await recommendedProblems(req.user!.id));
});

export const getStreak = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await solveStreak(req.user!.id));
});

// ---------- admin coding catalog ----------
export const adminCodingProblems = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  const problems = await prisma.codingProblem.findMany({
    where: {
      ...(q.source ? { source: q.source as string } : {}),
      ...(q.difficulty ? { difficulty: q.difficulty as string } : {}),
      ...(q.search ? { title: { contains: q.search as string, mode: "insensitive" } } : {}),
    },
    include: { _count: { select: { testCases: true, submissions: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return ok(res, problems);
});

export const adminCreateProblem = asyncHandler(async (req: Request, res: Response) => {
  const input = internalProblemSchema.parse(req.body);
  const { testCases, ...scalars } = input;
  const slug = scalars.slug ?? scalars.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const data = await prisma.codingProblem.create({
    data: {
      ...scalars,
      slug,
      source: "INTERNAL",
      sampleInput: testCases.find((t) => t.isSample)?.input ?? testCases[0].input,
      sampleOutput: testCases.find((t) => t.isSample)?.expectedOutput ?? testCases[0].expectedOutput,
      testCases: { create: testCases },
    },
    include: { testCases: true },
  });
  return created(res, data);
});

export const adminUpdateProblem = asyncHandler(async (req: Request, res: Response) => {
  const input = internalProblemSchema.partial().omit({ testCases: true }).parse(req.body);
  const { starterCode, ...rest } = input;
  const data = await prisma.codingProblem.update({
    where: { id: req.params.id },
    data: { ...rest, ...(starterCode !== undefined ? { starterCode } : {}) },
  });
  return ok(res, data);
});

export const adminReplaceTestCases = asyncHandler(async (req: Request, res: Response) => {
  const { testCases } = z
    .object({ testCases: testCaseSchema.array().min(1).max(20) })
    .parse(req.body);
  const subs = await prisma.codingSubmission.count({ where: { problemId: req.params.id } });
  if (subs > 0) {
    return res.status(409).json({
      success: false,
      message: `Problem has ${subs} submission(s) — test cases are locked to keep verdicts meaningful. Disable execution instead.`,
    });
  }
  await prisma.codingTestCase.deleteMany({ where: { problemId: req.params.id } });
  await prisma.codingTestCase.createMany({ data: testCases.map((t) => ({ ...t, problemId: req.params.id })) });
  const sample = testCases.find((t) => t.isSample) ?? testCases[0];
  await prisma.codingProblem.update({
    where: { id: req.params.id },
    data: { sampleInput: sample.input, sampleOutput: sample.expectedOutput },
  });
  return ok(res, await prisma.codingTestCase.findMany({ where: { problemId: req.params.id }, orderBy: { order: "asc" } }));
});

export const adminDeleteProblem = asyncHandler(async (req: Request, res: Response) => {
  const [subs, attempts] = await Promise.all([
    prisma.codingSubmission.count({ where: { problemId: req.params.id } }),
    prisma.codingAttempt.count({ where: { problemId: req.params.id } }),
  ]);
  if (subs > 0 || attempts > 0) {
    return res.status(409).json({
      success: false,
      message: `Cannot delete: ${subs} submission(s), ${attempts} attempt(s). Disable execution instead to preserve history.`,
    });
  }
  await prisma.codingProblem.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});

export const adminToggleLanguage = asyncHandler(async (req: Request, res: Response) => {
  const { active } = z.object({ active: z.boolean() }).parse(req.body);
  return ok(res, await prisma.codingLanguage.update({ where: { code: req.params.code }, data: { active } }));
});
