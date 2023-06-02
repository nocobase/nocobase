import { APIClient } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';

export const mockAPIClient = () => {
  const apiClient = new APIClient();
  const mockRequest = new MockAdapter(apiClient.axios);

  return { apiClient, mockRequest };
};
