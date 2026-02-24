import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import BackofficeLayout from "./components/BackofficeLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import PublicProjectDetail from "./pages/PublicProjectDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProjectsManagement from "./pages/admin/ProjectsManagement";
import AdminProjectDetail from "./pages/admin/AdminProjectDetail";
import UsersManagement from "./pages/admin/UsersManagement";
import AuditLogPage from "./pages/admin/AuditLogPage";
import UserDashboard from "./pages/user/UserDashboard";
import UserProjectDetail from "./pages/user/UserProjectDetail";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/project/:projectId" element={<PublicProjectDetail />} />
          <Route path="/invite/accept" element={<AcceptInvitePage />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><BackofficeLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="projects" element={<ProjectsManagement />} />
            <Route path="projects/:projectId" element={<AdminProjectDetail />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="audit-logs" element={<AuditLogPage />} />
          </Route>

          {/* User (Member and Client) */}
          <Route path="/dashboard" element={<ProtectedRoute requiredRole={["MEMBER", "CLIENT"]}><BackofficeLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
            <Route path="project/:projectId" element={<UserProjectDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
