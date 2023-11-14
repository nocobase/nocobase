import { useAPIClient } from '@nocobase/client';

export const useCustomRequestsResource = () => {
  const apiClient = useAPIClient();
  return apiClient.resource('customRequests');
};
