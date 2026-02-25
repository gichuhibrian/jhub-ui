import { apiService } from '@/lib/api';

export type ObjectiveStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface ObjectiveResponse {
  id: string;
  taskId: string;
  /** The backend field is `deliverable`, not `title`. */
  deliverable: string;
  status: ObjectiveStatus;
  isApproved?: boolean | null;
  reviewComment?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
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

export interface ReviewObjectivePayload {
  isApproved: boolean;
  reviewComment?: string;
}

export interface ReviewStatusResponse {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  allApproved: boolean;
  objectives: ObjectiveResponse[];
}

class ObjectiveService {
  private readonly basePath = '/objectives';

  /**
   * Fetches objectives for a given task.
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
   * Review an objective (approve or reject with comment)
   */
  async review(id: string, data: ReviewObjectivePayload): Promise<ObjectiveResponse> {
    const response = await apiService.post<ObjectiveResponse>(`${this.basePath}/${id}/review`, data);
    return response.data;
  }

  /**
   * Get review status for a task
   */
  async getReviewStatus(taskId: string): Promise<ReviewStatusResponse> {
    const response = await apiService.get<ReviewStatusResponse>(`${this.basePath}/task/${taskId}/review-status`);
    return response.data;
  }

  /**
   * Send task back for revision
   */
  async sendBackForRevision(taskId: string, feedback: string): Promise<{ message: string; feedback: string }> {
    const response = await apiService.post(`${this.basePath}/task/${taskId}/send-back`, { feedback });
    return response.data;
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
