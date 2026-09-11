import { Router } from "express";
import { getDashboard, getProfile, updateProfile } from "../controllers/student.controller";
import { authenticate } from "../middleware/auth";

const r = Router();
r.use(authenticate);
r.get("/profile", getProfile);
r.put("/profile", updateProfile);
r.get("/dashboard", getDashboard);
export default r;
