import { apiService } from '@/lib/api';

export interface ProjectDocumentResponse {
  id: string;
  projectId: string;
  documentName: string;
  documentUrl: string;
  createdAt: string;
}

export interface CreateProjectDocumentPayload {
  projectId: string;
  documentName: string;
  documentUrl: string;
}

class ProjectDocumentService {
  private readonly basePath = '/project-documents';

  async getAll(): Promise<ProjectDocumentResponse[]> {
    const response = await apiService.get<ProjectDocumentResponse[]>(this.basePath);
    return response.data;
  }

  async getByProject(projectId: string): Promise<ProjectDocumentResponse[]> {
    const response = await apiService.get<ProjectDocumentResponse[]>(this.basePath, {
      params: { projectId },
    });
    return response.data;
  }

  async create(data: CreateProjectDocumentPayload): Promise<ProjectDocumentResponse> {
    const response = await apiService.post<ProjectDocumentResponse>(this.basePath, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }
}

export const projectDocumentService = new ProjectDocumentService();
