import { Spin } from 'antd';
import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APIClientContext, useRequest } from '../api-client';

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

  const location = useLocation();

  // console.log('location', location);

  const service = useRequest(options, {
    manual: true,
  });

  const isAdminPage = location.pathname.startsWith('/admin');
  const token = api.auth.getToken() || '';

  useEffect(() => {
    if (isAdminPage && token) {
      service.run();
    }
  }, [isAdminPage, token]);

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

export const useHistoryCollectionsByNames = (collectionNames: string[]) => {
  const { historyCollections } = useContext(CollectionHistoryContext);
  return historyCollections.filter((i) => collectionNames.includes(i.name));
};

export const useCollectionHistory = () => {
  return useContext(CollectionHistoryContext);
};

export const useSnapshotFieldTargetCollectionName = (snapshotField) => {
  if (!snapshotField) return;
  const { historyCollections } = useCollectionHistory();
  const collection = historyCollections.find((i) => i.name === snapshotField.collectionName);
  const targetFieldName = collection.fields.find((i) => i.name === snapshotField.name).targetField;
  const targetField = collection.fields.find((i) => i.name === targetFieldName);
  return targetField?.target;
};
