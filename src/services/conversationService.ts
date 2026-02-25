import { apiService } from '@/lib/api';

export interface ProjectMessage {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  parentMessageId?: string;
  attachments: string[];
  documentIds: string[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  reactions: MessageReaction[];
  referencedDocuments?: {
    id: string;
    documentName: string;
    documentUrl: string;
  }[];
  _count?: {
    replies: number;
  };
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface CreateMessageDto {
  projectId: string;
  content: string;
  parentMessageId?: string;
  attachments?: string[];
  documentIds?: string[];
}

export interface UpdateMessageDto {
  content: string;
}

export interface AddReactionDto {
  emoji: string;
}

export const conversationService = {
  async createMessage(dto: CreateMessageDto): Promise<ProjectMessage> {
    const response = await apiService.post('/conversations/messages', dto);
    return response.data;
  },

  async getProjectMessages(
    projectId: string,
    limit = 50,
    cursor?: string
  ): Promise<ProjectMessage[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor);
    
    const response = await apiService.get(
      `/conversations/projects/${projectId}/messages?${params}`
    );
    return response.data;
  },

  async getThreadReplies(messageId: string): Promise<ProjectMessage[]> {
    const response = await apiService.get(`/conversations/messages/${messageId}/replies`);
    return response.data;
  },

  async updateMessage(messageId: string, dto: UpdateMessageDto): Promise<ProjectMessage> {
    const response = await apiService.put(`/conversations/messages/${messageId}`, dto);
    return response.data;
  },

  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    const response = await apiService.delete(`/conversations/messages/${messageId}`);
    return response.data;
  },

  async addReaction(messageId: string, dto: AddReactionDto): Promise<MessageReaction[]> {
    const response = await apiService.post(`/conversations/messages/${messageId}/reactions`, dto);
    return response.data;
  },

  async searchMessages(projectId: string, query: string): Promise<ProjectMessage[]> {
    const response = await apiService.get(
      `/conversations/projects/${projectId}/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};
