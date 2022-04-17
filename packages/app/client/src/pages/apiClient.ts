import { APIClient } from '@nocobase/client';

const apiClient = new APIClient({
  baseURL: process.env.SERVER_BASE_URL,
});

export default apiClient;
