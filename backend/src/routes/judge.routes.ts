import { Router } from "express";
import {
  adminCodingProblems,
  adminCreateProblem,
  adminDeleteProblem,
  adminReplaceTestCases,
  adminToggleLanguage,
  adminUpdateProblem,
  executeLimiter,
  getDailyProblem,
  getRecommended,
  getStreak,
  getSubmissionById,
  listLanguages,
  listSubmissions,
  runProblemCode,
  submitProblemCode,
} from "../controllers/judge.controller";
import { authenticate, authorize } from "../middleware/auth";

const r = Router();
r.use(authenticate);

// Discovery helpers
r.get("/coding/languages", listLanguages);
r.get("/coding/daily", getDailyProblem);
r.get("/coding/recommended", getRecommended);
r.get("/coding/streak", getStreak);

// Execute (rate-limited; sandboxed provider, never local exec)
r.post("/coding/problems/:id/run", executeLimiter, runProblemCode);
r.post("/coding/problems/:id/submit", executeLimiter, submitProblemCode);
r.get("/coding/problems/:id/submissions", listSubmissions);
r.get("/coding/submissions/:submissionId", getSubmissionById);

// Admin catalog
const admin = authorize("ADMIN");
r.get("/admin/coding/problems", admin, adminCodingProblems);
r.post("/admin/coding/problems", admin, adminCreateProblem);
r.put("/admin/coding/problems/:id", admin, adminUpdateProblem);
r.put("/admin/coding/problems/:id/test-cases", admin, adminReplaceTestCases);
r.delete("/admin/coding/problems/:id", admin, adminDeleteProblem);
r.put("/admin/coding/languages/:code", admin, adminToggleLanguage);

export default r;
