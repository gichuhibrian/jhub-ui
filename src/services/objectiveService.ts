import { apiService } from '@/lib/api';

export type ObjectiveStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface ObjectiveResponse {
  id: string;
  taskId: string;
  /** The backend field is `deliverable`, not `title`. */
  deliverable: string;
  status: ObjectiveStatus;
}

export interface CreateObjectivePayload {
  taskId: string;
  deliverable: string;
  status?: ObjectiveStatus;
}

export interface UpdateObjectivePayload {
  deliverable?: string;
  status?: ObjectiveStatus;
}

class ObjectiveService {
  private readonly basePath = '/objectives';

  /**
   * Fetches objectives for a given task.
   * Note: the backend does not currently filter by taskId query param;
   * this will work correctly once the backend supports `?taskId=x`.
   */
  async getByTask(taskId: string): Promise<ObjectiveResponse[]> {
    const response = await apiService.get<ObjectiveResponse[]>(this.basePath, {
      params: { taskId },
    });
    return response.data;
  }

  async create(data: CreateObjectivePayload): Promise<ObjectiveResponse> {
    const response = await apiService.post<ObjectiveResponse>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateObjectivePayload): Promise<ObjectiveResponse> {
    const response = await apiService.patch<ObjectiveResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }

  /**
   * Toggles an objective's completion state.
   * Maps `completed=true` → status `DONE`, `completed=false` → status `TODO`.
   */
  async toggleComplete(id: string, completed: boolean): Promise<ObjectiveResponse> {
    const response = await apiService.patch<ObjectiveResponse>(`${this.basePath}/${id}`, {
      status: completed ? 'DONE' : 'TODO',
    });
    return response.data;
  }
}

export const objectiveService = new ObjectiveService();
