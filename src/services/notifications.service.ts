import { apiService } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

class NotificationService {
  private readonly basePath = '/notifications';

  async getAll(filters?: { isRead?: boolean; limit?: number }): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (filters?.isRead !== undefined) {
      params.append('isRead', String(filters.isRead));
    }
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }
    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : this.basePath;
    const response = await apiService.get<Notification[]>(url);
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiService.get<number>(`/notifications/unread-count`);
    return response.data;
  }

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiService.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<void> {
    await apiService.patch(`/notifications/read-all`);
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`/notifications/${id}`);
  }
}

export const notificationService = new NotificationService();
