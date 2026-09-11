import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import catalogRoutes from "./routes/catalog.routes";
import resumeRoutes from "./routes/resume.routes";
import engagementRoutes from "./routes/engagement.routes";
import judgeRoutes from "./routes/judge.routes";

import { getDashboard } from "./controllers/student.controller";
import { authenticate } from "./middleware/auth";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.clientUrl.split(","), credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

  // Brute-force guard on auth endpoints (in-memory; fine for college scale,
  // documented in README — no Redis introduced).
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts — try again in 15 minutes" },
  });
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/students", studentRoutes);
  app.get("/api/dashboard", authenticate, getDashboard);
  app.use("/api", catalogRoutes);
  app.use("/api", resumeRoutes);
  app.use("/api", engagementRoutes);
  app.use("/api", judgeRoutes);

  app.use("/api", notFound);
  app.use(errorHandler);
  return app;
}
