import { apiService } from '@/lib/api';

export interface ProjectImageResponse {
  id: string;
  projectId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectImagePayload {
  projectId: string;
  imageUrl: string;
}

class ProjectImageService {
  private readonly basePath = '/project-images';

  async getAll(): Promise<ProjectImageResponse[]> {
    const response = await apiService.get<ProjectImageResponse[]>(this.basePath);
    return response.data;
  }

  async getByProject(projectId: string): Promise<ProjectImageResponse[]> {
    const response = await apiService.get<ProjectImageResponse[]>(this.basePath, {
      params: { projectId },
    });
    return response.data;
  }

  async create(data: CreateProjectImagePayload): Promise<ProjectImageResponse> {
    const response = await apiService.post<ProjectImageResponse>(this.basePath, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }
}

export const projectImageService = new ProjectImageService();
