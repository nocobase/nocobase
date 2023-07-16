import { useAPIClient } from './useAPIClient';

export function useResource(name: string, of?: string | number) {
  const apiClient = useAPIClient();
  return apiClient.resource(name, of);
}
