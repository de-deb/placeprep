import { Router } from "express";
import {
  adminDriveDetail,
  adminOverview,
  adminStudentDetail,
  adminStudents,
  aptitudeAnalytics,
  aptitudeMeta,
  applyToDrive,
  applicationTimeline,
  bulkApplicationStatus,
  codingSummary,
  createAnnouncement,
  createCompany,
  createDrive,
  createResource,
  deleteAnnouncement,
  deleteCompany,
  deleteDrive,
  deleteResource,
  driveApplicants,
  getCodingProblem,
  getCompany,
  getCompanyPrep,
  getDrive,
  listAnnouncements,
  listAptitudeQuestions,
  listCodingProblems,
  listCompanies,
  listDrives,
  listMyApplications,
  listQuizAttempts,
  listResources,
  recordQuizAttempt,
  setApplicationStatus,
  setCodingProgress,
  submitCodingAttempt,
  submitQuiz,
  toggleResourceBookmark,
  updateAnnouncement,
  updateCompany,
  updateDrive,
  updateResource,
  withdrawApplication,
} from "../controllers/catalog.controller";
import { authenticate, authorize } from "../middleware/auth";

const r = Router();
r.use(authenticate);

// Reads
r.get("/companies", listCompanies);
r.get("/companies/:id", getCompany);
r.get("/companies/:id/prep", getCompanyPrep);
r.get("/drives", listDrives);
r.get("/drives/:id", getDrive);
r.get("/resources", listResources);
r.get("/announcements", listAnnouncements);
r.get("/coding/problems", listCodingProblems);
r.get("/coding/problems/:id", getCodingProblem);
r.get("/coding/summary", codingSummary);
r.get("/aptitude/meta", aptitudeMeta);
r.get("/aptitude/questions", listAptitudeQuestions);
r.get("/aptitude/analytics", aptitudeAnalytics);

// Student actions
r.get("/applications", listMyApplications);
r.post("/applications", applyToDrive);
r.get("/applications/:id", applicationTimeline);
r.delete("/applications/:id", withdrawApplication);
r.put("/applications/:id/status", setApplicationStatus); // student: withdraw only (service-enforced)
r.put("/coding/problems/:id/progress", setCodingProgress);
r.post("/coding/problems/:id/attempts", submitCodingAttempt);
r.post("/aptitude/submit", submitQuiz);
r.get("/aptitude/attempts", listQuizAttempts);
r.post("/aptitude/attempts", recordQuizAttempt);
r.put("/resources/:id/bookmark", toggleResourceBookmark);

// Admin
const admin = authorize("ADMIN");
r.post("/companies", admin, createCompany);
r.put("/companies/:id", admin, updateCompany);
r.delete("/companies/:id", admin, deleteCompany);
r.post("/drives", admin, createDrive);
r.put("/drives/:id", admin, updateDrive);
r.delete("/drives/:id", admin, deleteDrive);
r.get("/drives/:id/applicants", admin, driveApplicants);
r.post("/resources", admin, createResource);
r.put("/resources/:id", admin, updateResource);
r.delete("/resources/:id", admin, deleteResource);
r.post("/announcements", admin, createAnnouncement);
r.put("/announcements/:id", admin, updateAnnouncement);
r.delete("/announcements/:id", admin, deleteAnnouncement);
r.post("/applications/bulk-status", admin, bulkApplicationStatus);
r.get("/admin/overview", admin, adminOverview);
r.get("/admin/students", admin, adminStudents);
r.get("/admin/students/:id", admin, adminStudentDetail);
r.get("/admin/drives/:id", admin, adminDriveDetail);

export default r;
