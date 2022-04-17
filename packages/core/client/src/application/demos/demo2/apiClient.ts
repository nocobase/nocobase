import { APIClient } from '@nocobase/client';
import mock from './mock';

const apiClient = new APIClient({
  baseURL: `${location.protocol}//${location.host}/api/`,
});

mock(apiClient);

export default apiClient;
