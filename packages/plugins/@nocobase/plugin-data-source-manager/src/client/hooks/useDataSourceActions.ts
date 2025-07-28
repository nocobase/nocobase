/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useDataSourceManager, useResourceActionContext } from '@nocobase/client';
import { useCallback, useEffect } from 'react';

export const useDataSourceActions = () => {
  const dm = useDataSourceManager();
  const api = useAPIClient();
  const { data } = useResourceActionContext();

  const handleDataSourcesUpdate = useCallback(
    (dataSources: any[]) => {
      dataSources?.forEach((dataSourceConfig) => {
        const dataSource = dm.getDataSource(dataSourceConfig.key);
        if (dataSource) {
          // TODO: Implement data source update logic
        }
      });
    },
    [dm],
  );

  useEffect(() => {
    if (data?.data) {
      handleDataSourcesUpdate(data.data);
    }
  }, [data, handleDataSourcesUpdate]);

  const actions = {
    reloadAllDataSources: useCallback(async () => {
      const dataSources = dm.getDataSources();
      await Promise.all(dataSources.map((ds) => ds.reload()));
    }, [dm]),

    reloadDataSource: useCallback(
      async (key: string) => {
        const dataSource = dm.getDataSource(key);
        if (dataSource) {
          await dataSource.reload();
        }
      },
      [dm],
    ),

    getDataSourceCollections: useCallback(
      (key: string) => {
        const dataSource = dm.getDataSource(key);
        return dataSource?.collectionManager.getCollections() || [];
      },
      [dm],
    ),

    testConnection: useCallback(
      async (key: string) => {
        try {
          await api.request({
            resource: 'dataSources',
            action: 'testConnection',
            params: { values: { key } },
          });
          return true;
        } catch (error) {
          console.error(`Failed to test connection for ${key}:`, error);
          return false;
        }
      },
      [api],
    ),
  };

  return actions;
};
