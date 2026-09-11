import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import CompaniesPage from "./pages/CompaniesPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import CodingPage from "./pages/CodingPage";
// Monaco editor is heavy (~2MB+) — code-split so the main bundle stays lean.
const CodingWorkspacePage = lazy(() => import("./pages/CodingWorkspacePage"));
import CodingProgressPage from "./pages/CodingProgressPage";
import AptitudePage from "./pages/AptitudePage";
import InterviewPage from "./pages/InterviewPage";
import ResumePage from "./pages/ResumePage";
import DrivesPage from "./pages/DrivesPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ResourcesPage from "./pages/ResourcesPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminStudentDetailPage from "./pages/admin/AdminStudentDetailPage";
import AdminCompaniesPage from "./pages/admin/AdminCompaniesPage";
import AdminDrivesPage from "./pages/admin/AdminDrivesPage";
import AdminDriveDetailPage from "./pages/admin/AdminDriveDetailPage";
import AdminCodingPage from "./pages/admin/AdminCodingPage";
import AdminResourcesPage from "./pages/admin/AdminResourcesPage";
import AdminAnnouncementsPage from "./pages/admin/AdminAnnouncementsPage";

function Student({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles={["STUDENT", "ADMIN"]}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<Student><DashboardPage /></Student>} />
          <Route path="/profile" element={<Student><ProfilePage /></Student>} />
          <Route path="/companies" element={<Student><CompaniesPage /></Student>} />
          <Route path="/companies/:id" element={<Student><CompanyDetailPage /></Student>} />
          <Route path="/coding" element={<Student><CodingPage /></Student>} />
          <Route
            path="/coding/:problemId"
            element={
              <Student>
                <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading code editor…</p>}>
                  <CodingWorkspacePage />
                </Suspense>
              </Student>
            }
          />
          <Route path="/coding/progress" element={<Student><CodingProgressPage /></Student>} />
          <Route path="/aptitude" element={<Student><AptitudePage /></Student>} />
          <Route path="/interview" element={<Student><InterviewPage /></Student>} />
          <Route path="/resume" element={<Student><ResumePage /></Student>} />
          <Route path="/drives" element={<Student><DrivesPage /></Student>} />
          <Route path="/applications" element={<Student><ApplicationsPage /></Student>} />
          <Route path="/resources" element={<Student><ResourcesPage /></Student>} />
          <Route path="/announcements" element={<Student><AnnouncementsPage /></Student>} />
          <Route path="/notifications" element={<Student><NotificationsPage /></Student>} />
          <Route path="/search" element={<Student><SearchPage /></Student>} />
          <Route path="/settings" element={<Student><SettingsPage /></Student>} />

          <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminOverviewPage /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute roles={["ADMIN"]}><AdminStudentsPage /></ProtectedRoute>} />
          <Route path="/admin/students/:id" element={<ProtectedRoute roles={["ADMIN"]}><AdminStudentDetailPage /></ProtectedRoute>} />
          <Route path="/admin/companies" element={<ProtectedRoute roles={["ADMIN"]}><AdminCompaniesPage /></ProtectedRoute>} />
          <Route path="/admin/drives" element={<ProtectedRoute roles={["ADMIN"]}><AdminDrivesPage /></ProtectedRoute>} />
          <Route path="/admin/coding" element={<ProtectedRoute roles={["ADMIN"]}><AdminCodingPage /></ProtectedRoute>} />
          <Route path="/admin/drives/:id" element={<ProtectedRoute roles={["ADMIN"]}><AdminDriveDetailPage /></ProtectedRoute>} />
          <Route path="/admin/resources" element={<ProtectedRoute roles={["ADMIN"]}><AdminResourcesPage /></ProtectedRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute roles={["ADMIN"]}><AdminAnnouncementsPage /></ProtectedRoute>} />

          {/* Legacy: old root redirect kept for bookmarks */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
