import React, { FC, ReactNode } from 'react';
import { CollectionCategroriesContext } from './context';
import { useAPIClient, useRequest } from '../api-client';

const coptions = {
  url: 'collectionCategories:list',
  params: {
    paginate: false,
    sort: ['sort'],
  },
};
export const CollectionCategroriesProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const service = useRequest<{
    data: any;
  }>(coptions);
  const api = useAPIClient();
  const refreshCategory = async () => {
    const { data } = await api.request(coptions);
    service.mutate(data);
    return data?.data || [];
  };
  return (
    <CollectionCategroriesContext.Provider
      value={{
        data: service?.data?.data,
        refresh: refreshCategory,
      }}
    >
      {children}
    </CollectionCategroriesContext.Provider>
  );
};
