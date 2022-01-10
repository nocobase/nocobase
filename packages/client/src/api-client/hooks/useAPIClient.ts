import { useContext } from 'react';
import { APIClientContext } from '../context';

export function useAPIClient() {
  return useContext(APIClientContext);
}
