import { api } from '@/lib/api';

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalUsers: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
}

export interface ProjectStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface TaskCompletionRate {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionRate: number;
}

export interface RecentProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  featuredImage: string | null;
  members: {
    id: string;
    name: string | null;
    email: string;
    isTeamLead: boolean;
  }[];
  progress: number;
  totalTasks: number;
  completedTasks: number;
}

export interface RecentActivity {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  action: string;
  target: string;
  timestamp: string;
  type: string;
}

export const reportsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    return api.get('/reports/dashboard');
  },

  getProjectStatusBreakdown: async (): Promise<ProjectStatusBreakdown[]> => {
    return api.get('/reports/projects/status-breakdown');
  },

  getTaskCompletionRate: async (): Promise<TaskCompletionRate> => {
    return api.get('/reports/tasks/completion-rate');
  },

  getRecentProjects: async (limit: number = 5): Promise<RecentProject[]> => {
    return api.get(`/reports/projects/recent?limit=${limit}`);
  },

  getRecentActivities: async (limit: number = 6): Promise<RecentActivity[]> => {
    return api.get(`/reports/activities/recent?limit=${limit}`);
  },
};
