import { Router } from "express";
import {
  changePassword,
  createNotification,
  getPrefs,
  globalSearch,
  interviewCategories,
  interviewSummary,
  listInterviewQuestions,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  setInterviewProgress,
  updateAccount,
  updatePrefs,
} from "../controllers/engagement.controller";
import { authenticate, authorize } from "../middleware/auth";

const r = Router();
r.use(authenticate);

// Notifications
r.get("/notifications", listNotifications);
r.put("/notifications/read-all", markAllNotificationsRead);
r.put("/notifications/:id/read", markNotificationRead);
r.post("/notifications", authorize("ADMIN"), createNotification);

// Global search
r.get("/search", globalSearch);

// Settings
r.put("/users/me", updateAccount);
r.put("/users/password", changePassword);
r.get("/users/prefs", getPrefs);
r.put("/users/prefs", updatePrefs);

// Interview workspace
r.get("/interview/categories", interviewCategories);
r.get("/interview/questions", listInterviewQuestions);
r.get("/interview/summary", interviewSummary);
r.put("/interview/questions/:id/progress", setInterviewProgress);

export default r;
