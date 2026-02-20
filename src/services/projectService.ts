import { apiService } from '@/lib/api';

export interface CreateProjectPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  siteUrl?: string;
  githubUrl?: string;
  status?: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  isPublic?: boolean;
}

// export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {}

export interface ProjectResponse {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  siteUrl: string | null;
  githubUrl: string | null;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

class ProjectService {
  private readonly basePath = '/projects';

  /**
   * Get all projects
   */
  async getAll(): Promise<ProjectResponse[]> {
    const response = await apiService.get<ProjectResponse[]>(this.basePath);
    return response.data;
  }

  /**
   * Get a single project by ID
   */
  async getById(id: string): Promise<ProjectResponse> {
    const response = await apiService.get<ProjectResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Create a new project
   */
  async create(data: CreateProjectPayload): Promise<ProjectResponse> {
    const response = await apiService.post<ProjectResponse>(this.basePath, data);
    return response.data;
  }

  /**
   * Update an existing project
   */
  async update(id: string, data: any): Promise<ProjectResponse> {
    const response = await apiService.patch<ProjectResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a project
   */
  async delete(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }
}

export const projectService = new ProjectService();
