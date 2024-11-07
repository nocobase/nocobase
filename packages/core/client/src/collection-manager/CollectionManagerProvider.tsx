/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useRequest } from '../api-client';
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

export const RemoteCollectionManagerProvider = (props: any) => {
  const dm = useDataSourceManager();
  const { refreshCH } = useCollectionHistory();

  useRequest<{
    data: any;
  }>(() => {
    return dm.reload().then(refreshCH);
  });

  return <CollectionManagerProvider_deprecated {...props} />;
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
