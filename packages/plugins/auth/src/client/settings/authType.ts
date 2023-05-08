import { useAPIClient } from '@nocobase/client';
import { createContext } from 'react';

export const AuthTypeContext = createContext<{
  type: string;
}>({ type: '' });

export const useAuthTypes = () => {
  const api = useAPIClient();
  const getAuthTypes = async () =>
    api
      .resource('authenticators')
      .listTypes()
      .then((res) => {
        const types = res?.data?.data || [];
        return types.map((type: string) => ({
          key: type,
          label: type,
          value: type,
        }));
      });
  return { getAuthTypes };
};
