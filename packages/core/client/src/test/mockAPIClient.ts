import MockAdapter from 'axios-mock-adapter';
import { APIClient } from '../api-client';

export const mockAPIClient = () => {
  const apiClient = new APIClient();
  const mockRequest = new MockAdapter(apiClient.axios);

  return { apiClient, mockRequest };
};
