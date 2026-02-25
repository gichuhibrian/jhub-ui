import { apiService } from '@/lib/api';

export type UserType = 'ADMIN' | 'MEMBER' | 'CLIENT';

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  userType: UserType;
  provider: string | null;
  googleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  userType?: UserType;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  userType?: UserType;
}

class UserService {
  private readonly basePath = '/users';

  async getAll(): Promise<UserResponse[]> {
    const response = await apiService.get<UserResponse[]>(this.basePath);
    return response.data;
  }

  async getById(id: string): Promise<UserResponse> {
    const response = await apiService.get<UserResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Creates a user via /auth/register (the only backend create-user endpoint).
   * If userType is specified and not MEMBER, a second PATCH call sets the role.
   */
  async create(data: CreateUserPayload): Promise<UserResponse> {
    const registerResponse = await apiService.post<{ user: UserResponse; access_token: string }>(
      '/auth/register',
      { name: data.name, email: data.email, password: data.password },
    );
    const user = registerResponse.data.user;
    if (data.userType && data.userType !== 'MEMBER') {
      return this.updateRole(user.id, data.userType);
    }
    return user;
  }

  async update(id: string, data: UpdateUserPayload): Promise<UserResponse> {
    const response = await apiService.patch<UserResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }

  async updateRole(id: string, userType: UserType): Promise<UserResponse> {
    const response = await apiService.patch<UserResponse>(`${this.basePath}/${id}`, { userType });
    return response.data;
  }
}

export const userService = new UserService();
