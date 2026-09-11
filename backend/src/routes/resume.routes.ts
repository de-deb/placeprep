import { Router } from "express";
import {
  addResumeEntry,
  deleteResumeEntry,
  getResume,
  updateResume,
  updateResumeEntry,
} from "../controllers/resume.controller";
import { authenticate } from "../middleware/auth";

const r = Router();
r.use(authenticate);

r.get("/resume", getResume);
r.put("/resume", updateResume);
r.post("/resume/:kind", addResumeEntry);
r.put("/resume/:kind/:id", updateResumeEntry);
r.delete("/resume/:kind/:id", deleteResumeEntry);

export default r;
