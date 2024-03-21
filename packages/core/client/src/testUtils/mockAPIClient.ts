import { APIClient } from '../api-client';

class MockAPIClient extends APIClient {
  mockAdapter() {
    const MockAdapter = require('axios-mock-adapter');
    return new MockAdapter(this.axios);
  }
}

export const mockAPIClient = () => {
  const apiClient = new MockAPIClient();
  const mockRequest = apiClient.mockAdapter();
  return { apiClient, mockRequest };
};
