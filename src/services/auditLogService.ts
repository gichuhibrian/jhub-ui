import { apiService } from '@/lib/api';

export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  user: AuditLogUser;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  userId?: string;
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AuditLogService {
  async getAll(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
    const params: Record<string, string | number> = {};
    if (filters.userId) params.userId = filters.userId;
    if (filters.entity) params.entity = filters.entity;
    if (filters.action) params.action = filters.action;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    const response = await apiService.get<AuditLogResponse>('/audit-logs', { params });
    return response.data;
  }
}

export const auditLogService = new AuditLogService();
export default auditLogService;
