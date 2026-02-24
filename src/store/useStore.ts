import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Project, Task, ActivityItem } from '@/types';
import { seedUsers, seedProjects, seedTasks, seedActivities } from '@/data/mockData';

interface AuthState {
  currentUser: User | null;
  login: (email: string, password: string) => User | null;
  logout: () => void;
}

interface AppState {
  users: User[];
  projects: Project[];
  tasks: Task[];
  activities: ActivityItem[];
  // User CRUD
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  // Project CRUD
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  // Task CRUD
  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  // Activity
  addActivity: (activity: ActivityItem) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      login: (email, password) => {
        const dataStore = useDataStore.getState();
        const user = dataStore.users.find(u => u.email === email && u.password === password);
        if (user) {
          set({ currentUser: user });
          return user;
        }
        return null;
      },
      logout: () => set({ currentUser: null }),
    }),
    { name: 'pm-auth' }
  )
);

export const useDataStore = create<AppState>()(
  persist(
    (set) => ({
      users: seedUsers,
      projects: seedProjects,
      tasks: seedTasks,
      activities: seedActivities,

      addUser: (user) => set((s) => ({ users: [...s.users, user] })),
      updateUser: (id, data) => set((s) => ({ users: s.users.map(u => u.id === id ? { ...u, ...data } : u) })),
      deleteUser: (id) => set((s) => ({ users: s.users.filter(u => u.id !== id) })),

      addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
      updateProject: (id, data) => set((s) => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...data } : p) })),
      deleteProject: (id) => set((s) => ({
        projects: s.projects.filter(p => p.id !== id),
        tasks: s.tasks.filter(t => t.projectId !== id),
      })),

      addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
      updateTask: (id, data) => set((s) => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...data } : t) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter(t => t.id !== id) })),

      addActivity: (activity) => set((s) => ({ activities: [activity, ...s.activities].slice(0, 50) })),
    }),
    { name: 'pm-data' }
  )
);

// Helper hooks
export const useProjectTasks = (projectId: string) => {
  return useDataStore((s) => s.tasks.filter(t => t.projectId === projectId));
};

export const useProjectMembers = (project: Project) => {
  return useDataStore((s) => s.users.filter(u => project.memberIds.includes(u.id)));
};

export const getTaskProgress = (task: Task): number => {
  if (task.objectives.length === 0) return task.status === 'done' ? 100 : 0;
  const completed = task.objectives.filter(o => o.completed).length;
  return Math.round((completed / task.objectives.length) * 100);
};

export const getProjectProgress = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const totalProgress = tasks.reduce((sum, t) => sum + getTaskProgress(t), 0);
  return Math.round(totalProgress / tasks.length);
};
