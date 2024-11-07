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

  const service = useRequest<{
    data: any;
  }>(() => {
    return dm.reload().then(refreshCH);
  });

  const { render } = useAppSpin();
  if (service.loading) {
    return render();
  }

  return <CollectionManagerProvider_deprecated {...props}></CollectionManagerProvider_deprecated>;
};

export const CollectionCategoriesProvider = (props) => {
  const { service, refreshCategory } = props;
  return (
    <CollectionCategoriesContext.Provider
      value={{
        data: service?.data?.data,
        refresh: refreshCategory,
        ...props,
      }}
    >
      {props.children}
    </CollectionCategoriesContext.Provider>
  );
};
