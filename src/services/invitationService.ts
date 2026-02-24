import { apiService } from '@/lib/api';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
export type InvitationRole = 'MEMBER' | 'CLIENT';

export interface InvitedBy {
  id: string;
  name: string | null;
  email: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  role: InvitationRole;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  invitedById: string;
  invitedBy: InvitedBy;
  createdAt: string;
  updatedAt: string;
}

export interface SendInvitationPayload {
  email: string;
  role: InvitationRole;
}

export type AcceptInvitationResult =
  | { type: 'EXISTING_USER'; email: string }
  | { type: 'NEW_USER'; email: string; token: string; role: string };

class InvitationService {
  private readonly basePath = '/invitations';

  async sendInvitation(data: SendInvitationPayload): Promise<InvitationResponse> {
    const response = await apiService.post<InvitationResponse>(this.basePath, data);
    return response.data;
  }

  async getAll(): Promise<InvitationResponse[]> {
    const response = await apiService.get<InvitationResponse[]>(this.basePath);
    return response.data;
  }

  async resend(id: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(
      `${this.basePath}/${id}/resend`,
    );
    return response.data;
  }

  async cancel(id: string): Promise<InvitationResponse> {
    const response = await apiService.delete<InvitationResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  async acceptInvitation(token: string): Promise<AcceptInvitationResult> {
    const response = await apiService.post<AcceptInvitationResult>(
      `${this.basePath}/accept`,
      { token },
    );
    return response.data;
  }
}

export const invitationService = new InvitationService();
