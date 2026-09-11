import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const r = Router();
r.post("/register", register);
r.post("/login", login);
r.get("/me", authenticate, me);
export default r;
