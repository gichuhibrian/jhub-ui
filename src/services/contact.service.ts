import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  message: string;
}

export const contactService = {
  async submitContact(data: ContactFormData): Promise<ContactResponse> {
    const response = await axios.post<ContactResponse>(
      `${API_URL}/contact`,
      data
    );
    return response.data;
  },
};
