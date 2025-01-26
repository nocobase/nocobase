/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { useIsAdminPage } from '../application/CustomRouterContextProvider';

export interface CollectionHistoryContextValue {
  historyCollections: any[];
  refreshCH: () => Promise<any>;
}

const CollectionHistoryContext = createContext<CollectionHistoryContextValue>({
  historyCollections: [],
  refreshCH: () => undefined,
});
CollectionHistoryContext.displayName = 'CollectionHistoryContext';

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

export const CollectionHistoryProvider: React.FC = (props) => {
  const api = useAPIClient();
  const isAdminPage = useIsAdminPage();
  const token = api.auth.getToken() || '';

  const service = useRequest<{
    data: any;
  }>(options, {
    refreshDeps: [isAdminPage, token],
    ready: !!(isAdminPage && token),
  });

  // 刷新 collecionHistory
  const refreshCH = useCallback(async () => {
    const { data } = await api.request(options);
    service.mutate(data);
    return data?.data || [];
  }, [service]);

  const value = useMemo(() => {
    return {
      historyCollections: service.data?.data,
      refreshCH,
    };
  }, [refreshCH, service.data?.data]);

  return <CollectionHistoryContext.Provider value={value}>{props.children}</CollectionHistoryContext.Provider>;
};

export const useHistoryCollectionsByNames = (collectionNames: string[]) => {
  const { historyCollections } = useContext(CollectionHistoryContext);
  return historyCollections?.filter((i) => collectionNames.includes(i.name)) || [];
};

export const useCollectionHistory = () => {
  return useContext(CollectionHistoryContext);
};
