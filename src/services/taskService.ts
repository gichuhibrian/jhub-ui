import { apiService } from '@/lib/api';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateTaskPayload {
  projectId: string;
  userId?: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export interface TaskObjective {
  id: string;
  deliverable: string;
  status: string;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskProject {
  id: string;
  title: string;
}

export interface TaskAssignee {
  id: string;
  name: string | null;
  email: string;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  userId: string | null;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project: TaskProject | null;
  assignedTo: TaskAssignee | null;
  objectives: TaskObjective[];
  _count: { comments: number };
  createdAt: string;
  updatedAt: string;
}

class TaskService {
  private readonly basePath = '/tasks';

  async getAll(): Promise<TaskResponse[]> {
    const response = await apiService.get<TaskResponse[]>(this.basePath);
    return response.data;
  }

  async getById(id: string): Promise<TaskResponse> {
    const response = await apiService.get<TaskResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  async create(data: CreateTaskPayload): Promise<TaskResponse> {
    const response = await apiService.post<TaskResponse>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateTaskPayload): Promise<TaskResponse> {
    const response = await apiService.patch<TaskResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }
}

export const taskService = new TaskService();
