import { apiService } from '@/lib/api';

export interface ProjectMemberUser {
  id: string;
  email: string;
  name: string | null;
}

export interface ProjectMemberProject {
  id: string;
  title: string;
  status: string;
}

export interface ProjectMemberResponse {
  id: string;
  projectId: string;
  userId: string;
  isTeamLead: boolean;
  project: ProjectMemberProject;
  user: ProjectMemberUser;
}

export interface AddMemberPayload {
  projectId: string;
  userId: string;
  isTeamLead?: boolean;
}

export interface AddMembersBatchPayload {
  projectId: string;
  userIds: string[];
  isTeamLead?: boolean;
}

class ProjectMemberService {
  private readonly basePath = '/project-members';

  /**
   * Fetches all project members.
   * Useful for computing per-user project counts on the users management page.
   */
  async getAll(): Promise<ProjectMemberResponse[]> {
    const response = await apiService.get<ProjectMemberResponse[]>(this.basePath);
    return response.data;
  }

  /**
   * Fetches members for a given project.
   * Note: the backend does not currently filter by projectId query param;
   * this will work correctly once the backend supports `?projectId=x`.
   */
  async getByProject(projectId: string): Promise<ProjectMemberResponse[]> {
    const response = await apiService.get<ProjectMemberResponse[]>(this.basePath, {
      params: { projectId },
    });
    return response.data;
  }

  async addMember(data: AddMemberPayload): Promise<ProjectMemberResponse> {
    const response = await apiService.post<ProjectMemberResponse>(this.basePath, data);
    return response.data;
  }

  async addMembersBatch(data: AddMembersBatchPayload): Promise<ProjectMemberResponse[]> {
    const response = await apiService.post<ProjectMemberResponse[]>(`${this.basePath}/batch`, data);
    return response.data;
  }

  async removeMember(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }

  async setTeamLead(id: string, isTeamLead: boolean): Promise<ProjectMemberResponse> {
    const response = await apiService.patch<ProjectMemberResponse>(`${this.basePath}/${id}`, {
      isTeamLead,
    });
    return response.data;
  }
}

export const projectMemberService = new ProjectMemberService();
