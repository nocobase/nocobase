import { useContext } from 'react';
import { APIClientContext } from '../context';

export function useResource(name: any, of?: any) {
  const apiClient = useContext(APIClientContext);
  return apiClient.resource(name, of);
}
