import { apiService } from '@/lib/api';

export interface CommentAuthor {
  id: string;
  name: string | null;
  email: string;
}

export interface CommentResponse {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  taskId: string;
  content: string;
}

export const commentService = {
  getByTask: async (taskId: string): Promise<CommentResponse[]> => {
    const response = await apiService.get(`/comments?taskId=${taskId}`);
    return response.data;
  },

  create: async (payload: CreateCommentPayload): Promise<CommentResponse> => {
    const response = await apiService.post('/comments', payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiService.delete(`/comments/${id}`);
  },
};
