export type UserType = 'ADMIN' | 'MEMBER' | 'CLIENT';
export type UserRole = 'admin' | 'user'; // Legacy - to be removed
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string | null;
  email: string;
  password?: string;
  userType: UserType;
  provider?: string | null;
  googleId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
  // Legacy field for backward compatibility
  role?: UserRole;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  startDate: string;
  endDate?: string | null;
  siteUrl?: string | null;
  githubUrl?: string | null;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for backward compatibility
  name?: string;
  dueDate?: string;
  images?: string[];
  featuredImage?: string;
  teamLeadId?: string;
  memberIds?: string[];
}

export interface Objective {
  id: string;
  deliverable: string;
  status: TaskStatus;
  taskId: string;
  // Legacy field
  title?: string;
  completed?: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  userId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  objectives?: Objective[];
  // Legacy fields
  assignedMemberId?: string;
  dueDate?: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  action: string;
  target: string;
  timestamp: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  'PLANNING': 'Planning',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
  'ON_HOLD': 'On Hold',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'TODO': 'To Do',
  'IN_PROGRESS': 'In Progress',
  'REVIEW': 'In Review',
  'DONE': 'Done',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  'LOW': 'Low',
  'MEDIUM': 'Medium',
  'HIGH': 'High',
  'URGENT': 'Urgent',
};

export const USER_TYPE_LABELS: Record<UserType, string> = {
  'ADMIN': 'Admin',
  'MEMBER': 'Member',
  'CLIENT': 'Client',
};
