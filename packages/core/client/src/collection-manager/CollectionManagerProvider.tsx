/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { CollectionManagerProvider } from '../data-source/collection/CollectionManagerProvider';
import { useDataSourceManager } from '../data-source/data-source/DataSourceManagerProvider';
import { useCollectionHistory } from './CollectionHistoryProvider';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { CollectionCategoriesContext } from './context';
import { CollectionManagerOptions } from './types';

/**
 * @deprecated use `CollectionManagerProvider` instead
 */
export const CollectionManagerProvider_deprecated: React.FC<CollectionManagerOptions> = (props) => {
  return (
    <CollectionManagerProvider>
      <CollectionManagerSchemaComponentProvider>{props.children}</CollectionManagerSchemaComponentProvider>
    </CollectionManagerProvider>
  );
};

const coptions = {
  url: 'collectionCategories:list',
  params: {
    paginate: false,
    sort: ['sort'],
  },
  refreshDeps: [],
};

export const RemoteCollectionManagerProvider = (props: any) => {
  const api = useAPIClient();
  const dm = useDataSourceManager();
  const { refreshCH } = useCollectionHistory();

  useRequest<{
    data: any;
  }>(() => {
    return dm.reload().then(refreshCH);
  });
  const result = useRequest<{
    data: any;
  }>(coptions);

  const refreshCategory = useCallback(async () => {
    const { data } = await api.request(coptions);
    result.mutate(data);
    return data?.data || [];
  }, [result]);

  return (
    <CollectionCategoriesProvider service={result} refreshCategory={refreshCategory}>
      <CollectionManagerProvider_deprecated {...props}></CollectionManagerProvider_deprecated>
    </CollectionCategoriesProvider>
  );
};

export const CollectionCategoriesProvider = (props) => {
  const { service, refreshCategory } = props;
  const value = useMemo(
    () => ({
      data: service?.data?.data,
      refresh: refreshCategory,
      ...props,
    }),
    [service?.data?.data, refreshCategory, props],
  );
  return <CollectionCategoriesContext.Provider value={value}>{props.children}</CollectionCategoriesContext.Provider>;
};
