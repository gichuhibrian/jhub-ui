import { apiService } from '@/lib/api';

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

export interface MemberWorkload {
  userId: string;
  userName: string;
  taskCount: number;
  urgentCount: number;
  highCount: number;
}

export interface TaskCompletionOverTime {
  date: string;
  count: number;
}

export const reportsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiService.get('/reports/dashboard');
    return response.data;
  },

  getProjectStatusBreakdown: async (): Promise<ProjectStatusBreakdown[]> => {
    const response = await apiService.get('/reports/projects/status-breakdown');
    return response.data;
  },

  getTaskCompletionRate: async (): Promise<TaskCompletionRate> => {
    const response = await apiService.get('/reports/tasks/completion-rate');
    return response.data;
  },

  getRecentProjects: async (limit: number = 5): Promise<RecentProject[]> => {
    const response = await apiService.get(`/reports/projects/recent?limit=${limit}`);
    return response.data;
  },

  getRecentActivities: async (limit: number = 6): Promise<RecentActivity[]> => {
    const response = await apiService.get(`/reports/activities/recent?limit=${limit}`);
    return response.data;
  },

  getMemberWorkload: async (): Promise<MemberWorkload[]> => {
    const response = await apiService.get('/reports/member-workload');
    return response.data;
  },

  getTaskCompletionOverTime: async (days: number = 30): Promise<TaskCompletionOverTime[]> => {
    const response = await apiService.get(`/reports/tasks/completion-over-time?days=${days}`);
    return response.data;
  },
};
