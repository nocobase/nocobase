/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAPIClient, useRequest } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';

export interface CollectionHistoryContextValue {
  historyCollections: any[];
  refreshCH: () => Promise<any>;
}

const CollectionHistoryContext = createContext<CollectionHistoryContextValue>({
  historyCollections: [],
  refreshCH: () => undefined,
});
CollectionHistoryContext.displayName = 'CollectionHistoryContext';

export const CollectionHistoryProvider: React.FC = (props) => {
  const api = useAPIClient();

  const options = {
    resource: 'collectionsHistory',
    action: 'list',
    params: {
      paginate: false,
      appends: ['fields'],
      filter: {
        // inherit: false,
      },
      sort: ['sort'],
    },
  };

  const location = useLocation();

  // console.log('location', location);

  const isAdminPage = location.pathname.startsWith('/admin');
  const token = api.auth.getToken() || '';
  const { render } = useAppSpin();

  const service = useRequest<{
    data: any;
  }>(options, {
    refreshDeps: [isAdminPage, token],
    ready: !!(isAdminPage && token),
  });

  // 刷新 collecionHistory
  const refreshCH = async () => {
    const { data } = await api.request(options);
    service.mutate(data);
    return data?.data || [];
  };

  if (service.loading) {
    return render();
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
