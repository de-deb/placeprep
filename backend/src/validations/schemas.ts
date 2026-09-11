import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100)
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email address"),
  password: passwordRule,
  role: z.enum(["STUDENT", "ADMIN"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  cgpa: z.number().min(0).max(10).nullable().optional(),
  branch: z.string().max(100).nullable().optional(),
  year: z.number().int().min(1).max(5).nullable().optional(),
  skills: z.array(z.string().max(40)).max(30).optional(),
  phone: z.string().max(20).nullable().optional(),
  resumeHeadline: z.string().max(200).nullable().optional(),
  location: z.string().max(160).nullable().optional(),
  college: z.string().max(160).nullable().optional(),
  degree: z.string().max(160).nullable().optional(),
  graduationYear: z.number().int().min(2000).max(2100).nullable().optional(),
  github: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  linkedin: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  portfolio: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
});

export const companySchema = z.object({
  name: z.string().min(2).max(120),
  industry: z.string().max(120).nullable().optional(),
  website: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  description: z.string().max(2000).nullable().optional(),
  packageLpa: z.number().min(0).max(100).nullable().optional(),
  eligibilityCgpa: z.number().min(0).max(10).nullable().optional(),
  roles: z.array(z.string().max(80)).default([]),
  process: z.string().max(1000).nullable().optional(),
  topics: z.array(z.string().max(80)).default([]),
});

export const driveSchema = z.object({
  companyId: z.string().min(1),
  title: z.string().min(3).max(160),
  date: z.string().datetime({ offset: true }).or(z.string().min(1)),
  deadline: z.string().datetime({ offset: true }).nullable().optional().or(z.literal("")),
  location: z.string().max(160).nullable().optional(),
  mode: z.string().max(40).optional(),
  eligibility: z.string().max(1000).nullable().optional(),
  description: z.string().max(3000).nullable().optional(),
  status: z.enum(["OPEN", "CLOSED", "UPCOMING"]).optional(),
  minCgpa: z.number().min(0).max(10).nullable().optional(),
  allowedBranches: z.array(z.string().max(100)).max(30).optional(),
  allowedYears: z.array(z.number().int().min(1).max(5)).max(5).optional(),
  requiredSkills: z.array(z.string().max(40)).max(30).optional(),
});

export const resourceSchema = z.object({
  title: z.string().min(3).max(160),
  category: z.string().min(2).max(60),
  type: z.string().min(2).max(40),
  url: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  description: z.string().max(2000).nullable().optional(),
  level: z.string().max(40).nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  company: z.string().max(120).nullable().optional(),
  featured: z.boolean().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(160),
  body: z.string().min(1).max(5000),
  audience: z.string().max(20).optional(),
});

export const codingProgressSchema = z.object({
  solved: z.boolean().optional(),
  bookmarked: z.boolean().optional(),
});

export const quizAttemptSchema = z.object({
  category: z.string().min(2).max(60),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
});

export const quizSubmitSchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string(), selectedIndex: z.number().int().min(0).max(5) }))
    .min(1)
    .max(50),
  timeTakenSeconds: z.number().int().min(0).max(24 * 3600).optional(),
  difficulty: z.string().max(40).optional(),
});

export const resumeSchema = z.object({
  summary: z.string().max(2000).nullable().optional(),
});

export const experienceSchema = z.object({
  company: z.string().min(1).max(160),
  role: z.string().min(1).max(160),
  startDate: z.string().max(40).nullable().optional(),
  endDate: z.string().max(40).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  technologies: z.array(z.string().max(40)).max(20).default([]),
});

export const projectSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).nullable().optional(),
  technologies: z.array(z.string().max(40)).max(20).default([]),
  githubUrl: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  liveUrl: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  startDate: z.string().max(40).nullable().optional(),
  endDate: z.string().max(40).nullable().optional(),
});

export const achievementSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(1000).nullable().optional(),
  date: z.string().max(40).nullable().optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(1).max(160),
  issuer: z.string().max(160).nullable().optional(),
  date: z.string().max(40).nullable().optional(),
  credentialUrl: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
});

export const applicationStatusSchema = z.object({
  status: z.enum([
    "APPLIED",
    "SHORTLISTED",
    "ONLINE_ASSESSMENT",
    "INTERVIEW",
    "SELECTED",
    "REJECTED",
    "WITHDRAWN",
  ]),
  note: z.string().max(500).nullable().optional(),
});

export const interviewProgressSchema = z.object({
  status: z.enum(["PRACTICED", "CONFIDENT"]),
});

export const codingAttemptSchema = z.object({
  verdict: z.enum(["SOLVED", "ATTEMPTED"]),
  note: z.string().max(500).nullable().optional(),
});

const codeField = z.string().min(1, "Code is required").max(100_000, "Code too large (max 100KB)");

export const codeRunSchema = z.object({
  language: z.enum(["python", "cpp", "java"]),
  code: codeField,
  stdin: z.string().max(10_000, "Custom input too large (max 10KB)").optional(),
});

export const codeSubmitSchema = z.object({
  language: z.enum(["python", "cpp", "java"]),
  code: codeField,
});

export const testCaseSchema = z.object({
  input: z.string().max(20_000).default(""),
  expectedOutput: z.string().min(1, "Expected output is required").max(20_000),
  isSample: z.boolean().default(false),
  order: z.number().int().min(0).max(100).default(0),
});

export const internalProblemSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().min(3).max(160).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens").optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  tags: z.array(z.string().max(40)).max(20).default([]),
  description: z.string().min(10).max(20000),
  constraints: z.string().max(2000).nullable().optional(),
  inputFormat: z.string().max(2000).nullable().optional(),
  outputFormat: z.string().max(2000).nullable().optional(),
  explanation: z.string().max(10000).nullable().optional(),
  hint: z.string().max(2000).nullable().optional(),
  estimatedMinutes: z.number().int().min(1).max(300).nullable().optional(),
  companies: z.array(z.string().max(80)).max(20).default([]),
  expectedTimeComplexity: z.string().max(100).nullable().optional(),
  expectedSpaceComplexity: z.string().max(100).nullable().optional(),
  starterCode: z.record(z.string().max(20000)).optional(),
  executionSupported: z.boolean().default(true),
  testCases: z.array(testCaseSchema).min(1, "At least one test case is required").max(20),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordRule,
});

export const updateAccountSchema = z.object({
  name: z.string().min(2).max(80),
});

export const prefsSchema = z.object({
  notifyDeadlines: z.boolean().optional(),
  notifyStatus: z.boolean().optional(),
  notifyAnnouncements: z.boolean().optional(),
  notifyPreparation: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
