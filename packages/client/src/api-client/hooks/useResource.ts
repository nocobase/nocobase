import { useContext } from 'react';
import { APIClientContext } from '../context';

export function useResource(name: string, of?: string | number) {
  const apiClient = useContext(APIClientContext);
  return apiClient.resource(name, of);
}
