import { useAPIClient, useRequest } from '@nocobase/client';
import { useState, createContext } from 'react';

export const AuthTypeContext = createContext<{
  type: string;
}>({ type: '' });

export const useAuthTypes = () => {
  const api = useAPIClient();
  const [types, setTypes] = useState([]);
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

  useRequest(getAuthTypes, {
    onSuccess: (types) => {
      setTypes(types);
    },
  });
  return { types, getAuthTypes };
};
