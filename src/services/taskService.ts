import { apiService } from '@/lib/api';

export interface CreateTaskPayload {
  projectId: string;
  userId?: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export interface TaskResponse {
  id: string;
  projectId: string;
  userId: string | null;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
}

class TaskService {
  private readonly basePath = '/tasks';

  /**
   * Get all tasks
   */
  async getAll(): Promise<TaskResponse[]> {
    const response = await apiService.get<TaskResponse[]>(this.basePath);
    return response.data;
  }

  /**
   * Get a single task by ID
   */
  async getById(id: string): Promise<TaskResponse> {
    const response = await apiService.get<TaskResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Create a new task
   */
  async create(data: CreateTaskPayload): Promise<TaskResponse> {
    const response = await apiService.post<TaskResponse>(this.basePath, data);
    return response.data;
  }

  /**
   * Update an existing task
   */
  async update(id: string, data: UpdateTaskPayload): Promise<TaskResponse> {
    const response = await apiService.patch<TaskResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }
}

export const taskService = new TaskService();
