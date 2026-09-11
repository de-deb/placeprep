import type { Request, Response } from "express";
import {
  announcementService,
  applicationService,
  companyService,
  driveService,
  resourceService,
} from "../services/catalog.service";
import { prepService } from "../services/prep.service";
import { adminService } from "../services/admin.service";
import { notificationService } from "../services/notification.service";
import { checkEligibility } from "../utils/eligibility";
import { prisma } from "../config/db";
import {
  announcementSchema,
  applicationStatusSchema,
  codingAttemptSchema,
  codingProgressSchema,
  companySchema,
  driveSchema,
  quizAttemptSchema,
  quizSubmitSchema,
  resourceSchema,
} from "../validations/schemas";
import { asyncHandler } from "../middleware/asyncHandler";
import { created, ok } from "../utils/responses";
import { z } from "zod";

// Companies
export const listCompanies = asyncHandler(async (req: Request, res: Response) => {
  const data = await companyService.list(req.query.search as string | undefined);
  return ok(res, data);
});
export const getCompany = asyncHandler(async (req: Request, res: Response) => {
  const data = await companyService.getById(req.params.id);
  if (!data) return res.status(404).json({ success: false, message: "Company not found" });
  // "Prepare for this company": relevant problems (tag overlap with topics)
  // + relevant interview questions (company relevance).
  const topics = data.topics ?? [];
  const [relevantProblems, interviewQuestions] = await Promise.all([
    topics.length
      ? prisma.codingProblem.findMany({
          where: { tags: { hasSome: topics } },
          select: { id: true, title: true, difficulty: true, tags: true },
          take: 6,
        })
      : [],
    prisma.interviewQuestion.findMany({
      where: { companies: { has: data.name } },
      select: { id: true, category: true, difficulty: true, question: true },
      take: 6,
    }),
  ]);
  const resources = await resourceService.list(undefined, { company: data.name });
  return ok(res, { ...data, relevantProblems, interviewQuestions, resources: resources.slice(0, 4) });
});
export const createCompany = asyncHandler(async (req: Request, res: Response) => {
  const data = await companyService.create(companySchema.parse(req.body));
  return created(res, data);
});
export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const data = await companyService.update(req.params.id, companySchema.partial().parse(req.body));
  return ok(res, data);
});
export const getCompanyPrep = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.getById(req.params.id);
  if (!company) return res.status(404).json({ success: false, message: "Company not found" });
  return ok(res, await prepService.companyPrep(req.user!.id, company.name));
});
export const deleteCompany = asyncHandler(async (req: Request, res: Response) => {
  await companyService.remove(req.params.id);
  return ok(res, { id: req.params.id });
});

// Drives (list includes per-student eligibility + applied flag)
export const listDrives = asyncHandler(async (req: Request, res: Response) => {
  const drives = await driveService.list(req.query.status as string | undefined);
  const [profile, apps] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: req.user!.id } }),
    prisma.application.findMany({ where: { userId: req.user!.id }, select: { driveId: true } }),
  ]);
  const applied = new Set(apps.map((a) => a.driveId));
  const student = {
    cgpa: profile?.cgpa ?? null,
    branch: profile?.branch ?? null,
    year: profile?.year ?? null,
    skills: profile?.skills ?? [],
  };
  return ok(
    res,
    drives.map((d) => ({
      ...d,
      applied: applied.has(d.id),
      eligibilityResult: checkEligibility(
        {
          minCgpa: d.minCgpa,
          allowedBranches: d.allowedBranches,
          allowedYears: d.allowedYears,
          requiredSkills: d.requiredSkills,
          eligibilityCgpa: d.company.eligibilityCgpa,
        },
        student
      ),
    }))
  );
});
export const getDrive = asyncHandler(async (req: Request, res: Response) => {
  const data = await driveService.getById(req.params.id);
  if (!data) return res.status(404).json({ success: false, message: "Drive not found" });
  return ok(res, data);
});
function drivePayload(input: z.infer<typeof driveSchema>) {
  return {
    companyId: input.companyId,
    title: input.title,
    date: new Date(input.date),
    deadline: input.deadline ? new Date(input.deadline) : undefined,
    location: input.location ?? undefined,
    mode: input.mode ?? "On-campus",
    eligibility: input.eligibility ?? undefined,
    description: input.description ?? undefined,
    status: input.status ?? "OPEN",
    minCgpa: input.minCgpa ?? undefined,
    allowedBranches: input.allowedBranches ?? undefined,
    allowedYears: input.allowedYears ?? undefined,
    requiredSkills: input.requiredSkills ?? undefined,
  };
}
export const createDrive = asyncHandler(async (req: Request, res: Response) => {
  const data = await driveService.create(drivePayload(driveSchema.parse(req.body)));
  return created(res, data);
});
export const updateDrive = asyncHandler(async (req: Request, res: Response) => {
  const input = driveSchema.partial().parse(req.body);
  const data = await driveService.update(req.params.id, {
    ...(input.companyId !== undefined ? { companyId: input.companyId } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.date !== undefined ? { date: new Date(input.date as string) } : {}),
    // Allow explicitly clearing deadline by sending null or empty string.
    ...("deadline" in input
      ? { deadline: input.deadline ? new Date(input.deadline as string) : null }
      : {}),
    ...(input.location !== undefined ? { location: input.location ?? undefined } : {}),
    ...(input.mode !== undefined ? { mode: input.mode } : {}),
    ...(input.eligibility !== undefined ? { eligibility: input.eligibility ?? undefined } : {}),
    ...(input.description !== undefined ? { description: input.description ?? undefined } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.minCgpa !== undefined ? { minCgpa: input.minCgpa ?? undefined } : {}),
    // Always apply array fields when present (empty array = clear the list).
    ...(input.allowedBranches !== undefined ? { allowedBranches: input.allowedBranches } : {}),
    ...(input.allowedYears !== undefined ? { allowedYears: input.allowedYears } : {}),
    ...(input.requiredSkills !== undefined ? { requiredSkills: input.requiredSkills } : {}),
  });
  return ok(res, data);
});
export const deleteDrive = asyncHandler(async (req: Request, res: Response) => {
  await driveService.remove(req.params.id);
  return ok(res, { id: req.params.id });
});

// Applications
export const listMyApplications = asyncHandler(async (req: Request, res: Response) => {
  const data = await applicationService.listForUser(req.user!.id);
  return ok(res, data);
});
export const applyToDrive = asyncHandler(async (req: Request, res: Response) => {
  const { driveId } = z.object({ driveId: z.string().min(1) }).parse(req.body);
  const data = await applicationService.apply(req.user!.id, driveId);
  return created(res, data);
});
export const withdrawApplication = asyncHandler(async (req: Request, res: Response) => {
  const data = await applicationService.withdraw(req.user!.id, req.params.id);
  return ok(res, data);
});
export const applicationTimeline = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await applicationService.timeline(req.user!.id, req.params.id));
});
export const setApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const input = applicationStatusSchema.parse(req.body);
  // Students may only withdraw their OWN applications; admins may transition any.
  if (req.user!.role !== "ADMIN") {
    const own = await applicationService.timeline(req.user!.id, req.params.id).catch(() => null);
    if (!own) return res.status(404).json({ success: false, message: "Application not found" });
  }
  const data = await applicationService.setStatus(req.params.id, input.status, req.user!.id, input.note, req.user!.role);
  return ok(res, data);
});
export const driveApplicants = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  return ok(
    res,
    await applicationService.applicantsForDrive(req.params.id, {
      search: q.search as string | undefined,
      branch: q.branch as string | undefined,
      minCgpa: q.minCgpa ? Number(q.minCgpa) : undefined,
      status: q.status as string | undefined,
    })
  );
});
export const bulkApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const input = z.object({ ids: z.array(z.string()).min(1).max(100), ...applicationStatusSchema.shape }).parse(req.body);
  return ok(res, await applicationService.bulkSetStatus(input.ids, input.status, req.user!.id, input.note));
});

// Resources (+ bookmarks)
export const listResources = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  const data = await resourceService.listWithBookmarks(req.user!.id, q.category as string | undefined, {
    search: q.search as string | undefined,
    level: q.level as string | undefined,
    tag: q.tag as string | undefined,
    featured: q.featured === "true",
    company: q.company as string | undefined,
    bookmarked: q.bookmarked === "true",
  });
  return ok(res, data);
});
export const toggleResourceBookmark = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await resourceService.toggleBookmark(req.user!.id, req.params.id));
});
export const createResource = asyncHandler(async (req: Request, res: Response) => {
  const input = resourceSchema.parse(req.body);
  const data = await resourceService.create({
    title: input.title,
    category: input.category,
    type: input.type,
    url: input.url || undefined,
    description: input.description ?? undefined,
    level: input.level ?? undefined,
    tags: input.tags ?? [],
    company: input.company ?? undefined,
    featured: input.featured ?? false,
  });
  return created(res, data);
});
export const updateResource = asyncHandler(async (req: Request, res: Response) => {
  const input = resourceSchema.partial().parse(req.body);
  const data = await resourceService.update(req.params.id, {
    ...(input.title ? { title: input.title } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.url !== undefined ? { url: input.url || undefined } : {}),
    ...(input.description !== undefined ? { description: input.description ?? undefined } : {}),
    ...(input.level !== undefined ? { level: input.level ?? undefined } : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.company !== undefined ? { company: input.company ?? undefined } : {}),
    ...(input.featured !== undefined ? { featured: input.featured } : {}),
  });
  return ok(res, data);
});
export const deleteResource = asyncHandler(async (req: Request, res: Response) => {
  await resourceService.remove(req.params.id);
  return ok(res, { id: req.params.id });
});

// Announcements (creation fans out to students respecting prefs)
export const listAnnouncements = asyncHandler(async (_req: Request, res: Response) => {
  const data = await announcementService.list();
  return ok(res, data);
});
export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const input = announcementSchema.parse(req.body);
  const data = await announcementService.create({
    title: input.title,
    body: input.body,
    audience: input.audience ?? "ALL",
    createdById: req.user!.id,
  });
  await notificationService.notifyAllStudents({
    type: "ANNOUNCEMENT",
    title: input.title,
    message: input.body.slice(0, 200),
    link: "/announcements",
    ref: `announcement:${data.id}`,
  });
  return created(res, data);
});
export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const input = announcementSchema.partial().parse(req.body);
  const data = await announcementService.update(req.params.id, input);
  return ok(res, data);
});
export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  await announcementService.remove(req.params.id);
  return ok(res, { id: req.params.id });
});

// Coding
export const listCodingProblems = asyncHandler(async (req: Request, res: Response) => {
  const data = await prepService.listProblemsWithProgress(
    req.user!.id,
    req.query.difficulty as string | undefined,
    req.query.search as string | undefined,
    req.query.tag as string | undefined,
    req.query.source as string | undefined
  );
  return ok(res, data);
});
export const getCodingProblem = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await prepService.problemDetail(req.user!.id, req.params.id));
});
export const setCodingProgress = asyncHandler(async (req: Request, res: Response) => {
  const input = codingProgressSchema.parse(req.body);
  const data = await prepService.setProgress(req.user!.id, req.params.id, input);
  return ok(res, data);
});
export const submitCodingAttempt = asyncHandler(async (req: Request, res: Response) => {
  const input = codingAttemptSchema.parse(req.body);
  const data = await prepService.submitAttempt(req.user!.id, req.params.id, input.verdict, input.note);
  return created(res, data);
});
export const codingSummary = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await prepService.codingSummary(req.user!.id));
});

// Aptitude
export const aptitudeMeta = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await prepService.aptitudeMeta());
});
export const listAptitudeQuestions = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  const take = q.take ? Math.min(50, Math.max(1, Number(q.take))) : undefined;
  const data = await prepService.listQuestionsPublic(
    q.category as string | undefined,
    q.difficulty as string | undefined,
    q.topic as string | undefined,
    take
  );
  return ok(res, data);
});
export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const input = quizSubmitSchema.parse(req.body);
  const graded = await prepService.submitQuiz(req.user!.id, input.answers, {
    timeTakenSeconds: input.timeTakenSeconds,
    difficulty: input.difficulty,
  });
  return ok(res, graded);
});
export const listQuizAttempts = asyncHandler(async (req: Request, res: Response) => {
  const data = await prepService.listAttempts(req.user!.id);
  return ok(res, data);
});
export const recordQuizAttempt = asyncHandler(async (req: Request, res: Response) => {
  const input = quizAttemptSchema.parse(req.body);
  const data = await prepService.recordAttempt(req.user!.id, input.category, input.score, input.total);
  return created(res, data);
});
export const aptitudeAnalytics = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await prepService.aptitudeAnalytics(req.user!.id));
});

// Admin
export const adminOverview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.overview();
  return ok(res, data);
});
export const adminStudents = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  const data = await adminService.listStudents(
    q.search as string | undefined,
    q.branch as string | undefined,
    q.minCgpa ? Number(q.minCgpa) : undefined
  );
  return ok(res, data);
});
export const adminStudentDetail = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await adminService.studentDetail(req.params.id));
});
export const adminDriveDetail = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await adminService.driveDetail(req.params.id));
});
