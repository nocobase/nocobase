import { APIClientContext, useRequest } from '@nocobase/client';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CollectionHistoryContextValue {
  historyCollections: any[];
  refreshCH: () => Promise<any>;
}

const CollectionHistoryContext = createContext<CollectionHistoryContextValue>({
  historyCollections: [],
  refreshCH: () => undefined,
});

export const CollectionHistoryProvider: React.FC = (props) => {
  const api = useContext(APIClientContext);

  const options = {
    resource: 'collectionsHistory',
    action: 'list',
    params: {
      paginate: false,
      appends: ['fields', 'fields.uiSchema'],
      filter: {
        // inherit: false,
      },
      sort: ['sort'],
    },
  };

  const service = useRequest(options);

  // 刷新 collecionHistory
  const refreshCH = async () => {
    const { data } = await api.request(options);
    service.mutate(data);
    return data?.data || [];
  };

  if (service.loading) {
    return <Spin />;
  }

  return (
    <CollectionHistoryContext.Provider
      value={{
        historyCollections: service.data?.data,
        refreshCH,
      }}
    >
      {props.children}
    </CollectionHistoryContext.Provider>
  );
};

export const useHistoryCollectionByKey = (key: string) => {
  const { historyCollections } = useContext(CollectionHistoryContext);
  return historyCollections.find((i) => i.key === key);
};

export const useCollectionHistory = () => {
  return useContext(CollectionHistoryContext);
};
