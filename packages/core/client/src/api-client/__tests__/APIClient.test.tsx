import axios from 'axios';
import { APIClient } from '../APIClient';

describe('APIClient', () => {
  describe('axios', () => {
    it('case 1', () => {
      const apiClient = new APIClient();
      expect(apiClient.axios).toBeDefined();
      expect(typeof apiClient.axios).toBe('function');
      expect(typeof apiClient.axios.request).toBe('function');
    });

    it('case 2', () => {
      const apiClient = new APIClient({
        baseURL: 'http://localhost/api/',
      });
      expect(apiClient.axios.defaults.baseURL).toBe('http://localhost/api/');
    });

    it('case 3', () => {
      const instance = axios.create();
      const apiClient = new APIClient(instance);
      expect(apiClient.axios).toBe(instance);
    });
  });
});
