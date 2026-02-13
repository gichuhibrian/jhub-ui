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
import UserDashboard from "./pages/user/UserDashboard";
import UserProjectDetail from "./pages/user/UserProjectDetail";
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

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><BackofficeLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="projects" element={<ProjectsManagement />} />
            <Route path="projects/:projectId" element={<AdminProjectDetail />} />
            <Route path="users" element={<UsersManagement />} />
          </Route>

          {/* User */}
          <Route path="/dashboard" element={<ProtectedRoute requiredRole="user"><BackofficeLayout /></ProtectedRoute>}>
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
