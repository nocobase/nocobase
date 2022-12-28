import { APIClientContext, useRequest } from '@nocobase/client';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CollectionHistoryContextValue {
  historyCollections: any[];
}

const CollectionHistoryContext = createContext<CollectionHistoryContextValue>({
  historyCollections: [],
});

export const CollectionHistoryProvider: React.FC = (props) => {
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

  if (service.loading) {
    return <Spin />;
  }

  return (
    <CollectionHistoryContext.Provider
      value={{
        historyCollections: service.data?.data,
      }}
    >
      {props.children}
    </CollectionHistoryContext.Provider>
  );
};

export const useHistoryCollection = (key: string) => {
  const { historyCollections } = useContext(CollectionHistoryContext);
  console.log(
    key,
    historyCollections.find((i) => i.key === key),
  );
  return historyCollections.find((i) => i.key === key);
};
