import { APIClient } from '@nocobase/client';

const apiClient = new APIClient({
  baseURL: process.env.API_BASE_URL,
});

export default apiClient;
