/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';
import { CollectionManagerProvider } from '../data-source/collection/CollectionManagerProvider';
import { useDataSourceManager } from '../data-source/data-source/DataSourceManagerProvider';
import { useCollectionHistory } from './CollectionHistoryProvider';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { CollectionCategroriesContext } from './context';
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
};

export const RemoteCollectionManagerProvider = (props: any) => {
  const api = useAPIClient();
  const dm = useDataSourceManager();
  const { refreshCH } = useCollectionHistory();

  const service = useRequest<{
    data: any;
  }>(() => {
    return dm.reload().then(refreshCH);
  });
  const result = useRequest<{
    data: any;
  }>(coptions);

  const { render } = useAppSpin();
  const refreshCategory = useCallback(async () => {
    const { data } = await api.request(coptions);
    result.mutate(data);
    return data?.data || [];
  }, [result]);

  if (service.loading) {
    return render();
  }

  return (
    <CollectionCategroriesProvider service={result} refreshCategory={refreshCategory}>
      <CollectionManagerProvider_deprecated {...props}></CollectionManagerProvider_deprecated>
    </CollectionCategroriesProvider>
  );
};

export const CollectionCategroriesProvider = (props) => {
  const { service, refreshCategory } = props;
  return (
    <CollectionCategroriesContext.Provider
      value={{
        data: service?.data?.data,
        refresh: refreshCategory,
        ...props,
      }}
    >
      {props.children}
    </CollectionCategroriesContext.Provider>
  );
};
