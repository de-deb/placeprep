import { prisma } from "../../config/db";
import { getExecutionProvider } from "./types";

export type JudgeVerdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "COMPILATION_ERROR"
  | "RUNTIME_ERROR"
  | "TIME_LIMIT_EXCEEDED";

export interface TestVerdict {
  order: number;
  input: string;
  expectedOutput: string | null; // null = hidden from response (submit mode)
  actualOutput: string | null;
  passed: boolean | null; // null when execution itself failed
  stdout: string;
  stderr: string;
  timeSec: number | null;
  memoryKb: number | null;
}

/** Normalize program output before comparing (trailing spaces/newlines ignored). */
export function normalizeOutput(s: string): string {
  return s
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

async function getRunnableProblem(problemId: string) {
  const problem = await prisma.codingProblem.findUnique({
    where: { id: problemId },
    include: { testCases: { orderBy: { order: "asc" } } },
  });
  if (!problem) throw httpError(404, "Problem not found");
  if (problem.source !== "INTERNAL" || !problem.executionSupported) {
    throw httpError(400, "This problem is external practice — use “Practice externally” or “Mark as solved”.");
  }
  return problem;
}

export async function assertLanguageActive(code: string) {
  const lang = await prisma.codingLanguage.findUnique({ where: { code } });
  // Languages table is seeded; if a row is missing/disabled, reject clearly.
  if (!lang || !lang.active) throw httpError(400, `Unsupported language: ${code}`);
  return lang;
}

/**
 * RUN: execute against sample tests only. Returns full outputs (samples are
 * public by design). Never saves a submission.
 */
export async function runCode(userId: string, problemId: string, language: string, code: string, stdin?: string) {
  if (!code || code.length > 100_000) throw httpError(400, "Code must be 1–100,000 characters");
  if (stdin && stdin.length > 10_000) throw httpError(400, "Custom input too large (max 10KB)");
  const problem = await getRunnableProblem(problemId);
  await assertLanguageActive(language);
  void userId;

  const provider = getExecutionProvider();
  const samples = problem.testCases.filter((t) => t.isSample);

  if (stdin != null) {
    const r = await provider.execute({ language, code, stdin, cpuTimeLimitSec: 2, memoryLimitKb: 131072 });
    return { mode: "custom" as const, result: toTestVerdict(0, stdin, null, r) };
  }
  if (samples.length === 0) throw httpError(400, "No sample tests on this problem yet");

  const results: TestVerdict[] = [];
  for (const t of samples) {
    const r = await provider.execute({ language, code, stdin: t.input, cpuTimeLimitSec: 2, memoryLimitKb: 131072 });
    results.push(toTestVerdict(t.order, t.input, t.expectedOutput, r));
  }
  return { mode: "samples" as const, results };
}

function toTestVerdict(order: number, input: string, expected: string | null, r: Awaited<ReturnType<ReturnType<typeof getExecutionProvider>["execute"]>>): TestVerdict {
  if (r.timedOut) {
    return { order, input, expectedOutput: expected, actualOutput: null, passed: false, stdout: r.stdout, stderr: "Time limit exceeded (2s)", timeSec: r.timeSec, memoryKb: r.memoryKb };
  }
  if (r.compileOutput) {
    return { order, input, expectedOutput: expected, actualOutput: null, passed: false, stdout: "", stderr: r.compileOutput, timeSec: null, memoryKb: null };
  }
  if (r.exitCode !== 0 || r.signal) {
    return { order, input, expectedOutput: expected, actualOutput: r.stdout || null, passed: false, stdout: r.stdout, stderr: r.stderr || `Exited with code ${r.exitCode}${r.signal ? ` (${r.signal})` : ""}`, timeSec: r.timeSec, memoryKb: r.memoryKb };
  }
  const actual = normalizeOutput(r.stdout);
  const passed = expected == null ? null : actual === normalizeOutput(expected);
  return { order, input, expectedOutput: expected, actualOutput: actual, passed, stdout: r.stdout, stderr: r.stderr, timeSec: r.timeSec, memoryKb: r.memoryKb };
}

/**
 * SUBMIT: execute against ALL tests (samples + hidden). Hidden inputs/outputs
 * are never returned. Saves a CodingSubmission, flips progress on ACCEPTED.
 */
export async function submitCode(userId: string, problemId: string, language: string, code: string) {
  if (!code || code.length > 100_000) throw httpError(400, "Code must be 1–100,000 characters");
  const problem = await getRunnableProblem(problemId);
  await assertLanguageActive(language);
  if (problem.testCases.length === 0) throw httpError(400, "This problem has no test cases yet");

  const provider = getExecutionProvider();
  let passed = 0;
  let verdict: JudgeVerdict = "ACCEPTED";
  let worstMs = 0;
  let worstMem = 0;

  for (const t of problem.testCases) {
    const r = await provider.execute({ language, code, stdin: t.input, cpuTimeLimitSec: 2, memoryLimitKb: 131072 });
    worstMs = Math.max(worstMs, Math.round((r.timeSec ?? 0) * 1000));
    worstMem = Math.max(worstMem, r.memoryKb ?? 0);
    if (r.timedOut) {
      verdict = "TIME_LIMIT_EXCEEDED";
      break;
    }
    if (r.compileOutput) {
      verdict = "COMPILATION_ERROR";
      break;
    }
    if (r.exitCode !== 0 || r.signal) {
      verdict = "RUNTIME_ERROR";
      break;
    }
    if (normalizeOutput(r.stdout) === normalizeOutput(t.expectedOutput)) {
      passed += 1;
    } else {
      verdict = "WRONG_ANSWER";
      break;
    }
  }

  const submission = await prisma.codingSubmission.create({
    data: {
      userId, problemId, language, sourceCode: code, status: verdict,
      runtimeMs: worstMs || null, memoryKb: worstMem || null,
      passedTests: passed, totalTests: problem.testCases.length,
    },
  });

  if (verdict === "ACCEPTED") {
    await prisma.codingProgress.upsert({
      where: { userId_problemId: { userId, problemId } },
      create: { userId, problemId, solved: true },
      update: { solved: true },
    });
    await prisma.codingAttempt.create({ data: { userId, problemId, verdict: "SOLVED", note: `Judge ${language}` } });
  }

  return {
    submissionId: submission.id,
    verdict,
    passedTests: passed,
    totalTests: problem.testCases.length,
    runtimeMs: worstMs || null,
    memoryKb: worstMem || null,
  };
}

/** Own submission history for a problem (code included — owner only, route-scoped). */
export function submissionHistory(userId: string, problemId: string, take = 20) {
  return prisma.codingSubmission.findMany({
    where: { userId, problemId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function getSubmission(userId: string, id: string) {
  return prisma.codingSubmission.findFirst({ where: { id, userId } }).then((s) => {
    if (!s) throw httpError(404, "Submission not found");
    return s;
  });
}

/**
 * Daily problem: deterministic pick from weakest-tag unsolved (falls back to
 * rotating unsolved, then random solved for review). Same input → same pick.
 */
export async function dailyProblem(userId: string) {
  const summary = await import("../prep.service").then((m) => m.prepService.codingSummary(userId));
  const all = await prisma.codingProblem.findMany({
    where: { source: "INTERNAL", executionSupported: true },
    select: { id: true, title: true, difficulty: true, tags: true },
  });
  const solvedIds = new Set(
    (await prisma.codingProgress.findMany({ where: { userId, solved: true }, select: { problemId: true } })).map((p) => p.problemId)
  );
  const unsolved = all.filter((p) => !solvedIds.has(p.id));
  const pool = unsolved.length > 0 ? unsolved : all;
  if (pool.length === 0) return null;

  const dayIndex = Math.floor(Date.now() / 86400000);
  let candidates = pool;
  if (summary.weakestTag) {
    const weak = pool.filter((p) => p.tags.includes(summary.weakestTag!));
    if (weak.length > 0) candidates = weak;
  }
  const pick = candidates[dayIndex % candidates.length];
  return {
    ...pick,
    reason: summary.weakestTag
      ? `Weakest topic: ${summary.weakestTag} — picked for today`
      : "Daily pick — keep the streak alive",
    date: new Date().toISOString().slice(0, 10),
  };
}

/** Recommended next problems: unsolved in weakest tags first. */
export async function recommendedProblems(userId: string, take = 5) {
  const summary = await import("../prep.service").then((m) => m.prepService.codingSummary(userId));
  const solvedIds = new Set(
    (await prisma.codingProgress.findMany({ where: { userId, solved: true }, select: { problemId: true } })).map((p) => p.problemId)
  );
  const all = await prisma.codingProblem.findMany({
    where: { source: "INTERNAL" },
    select: { id: true, title: true, difficulty: true, tags: true },
    take: 200,
  });
  const rankDifficulty = (d: string) => (d === "Easy" ? 0 : d === "Medium" ? 1 : 2);
  const weakFirst = [...(summary.weakestTags.map((t) => t.tag)), ...(summary.strongestTags.map((t) => t.tag))];
  const score = (p: { tags: string[]; difficulty: string }) => {
    const wi = p.tags.reduce((best, t) => {
      const i = weakFirst.indexOf(t);
      return i >= 0 ? Math.min(best, i) : best;
    }, 99);
    return wi * 10 + rankDifficulty(p.difficulty);
  };
  return all
    .filter((p) => !solvedIds.has(p.id))
    .sort((a, b) => score(a) - score(b))
    .slice(0, take)
    .map((p) => ({ ...p, reason: p.tags.find((t) => weakFirst.includes(t)) ? `Strengthen ${p.tags.find((t) => weakFirst.includes(t))}` : "Recommended" }));
}

/** Solve streak in days from judge submissions (used by dashboard/progress). */
export async function solveStreak(userId: string) {
  const subs = await prisma.codingSubmission.findMany({
    where: { userId, status: "ACCEPTED" },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 365,
  });
  const days = new Set(subs.map((s) => s.createdAt.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  // Streak counts back from today (or yesterday if nothing solved today yet).
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { streak, activeDays: days.size };
}
