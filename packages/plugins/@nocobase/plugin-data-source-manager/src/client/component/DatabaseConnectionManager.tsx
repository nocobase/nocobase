/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import {
  SchemaComponent,
  useAPIClient,
  useDataSourceManager,
  usePlugin,
  useRecord,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PluginDatabaseConnectionsClient from '../';
import { databaseConnectionSchema } from '../schema';
import { ThirdDataSource } from '../ThridDataSource';
import { CreateDatabaseConnectAction } from './CreateDatabaseConnectAction';
import { EditDatabaseConnectionAction } from './EditDatabaseConnectionAction';
import { ViewDatabaseConnectionAction } from './ViewDatabaseConnectionAction';
import { addDatasourceCollections } from '../hooks';

export const DatabaseConnectionManagerPane = () => {
  const { t } = useTranslation();
  const plugin = usePlugin(PluginDatabaseConnectionsClient);
  const dm = useDataSourceManager();
  const api = useAPIClient(); // 移到组件顶层

  const types = [...plugin.types.keys()]
    .map((key) => {
      const type = plugin.types.get(key);
      return {
        value: key,
        label: t(type?.label),
      };
    })
    .concat([{ value: 'main', label: t('Main') }]);

  const reloadKeys = React.useRef<string[]>([]);

  useEffect(() => {
    return () => {
      dm.getDataSources().forEach((dataSource) => {
        if (reloadKeys.current.includes(dataSource.key)) {
          dataSource.reload();
        }
      });
    };
  }, [reloadKeys]);

  const dataSourceDeleteCallback = useCallback(
    (keys: string[]) => {
      dm.removeDataSources(keys);
    },
    [dm],
  );

  const dataSourceCreateCallback = useCallback(
    async (data: any, collections) => {
      if (!data.options.addAllCollections) {
        await addDatasourceCollections(api, data.key, { collections, dbOptions: data.options });
      }
      dm.addDataSource(ThirdDataSource, data);
      reloadKeys.current = [...reloadKeys.current, data.key];
    },
    [api, dm],
  );

  const useRefreshActionProps = () => {
    const service = useResourceActionContext();
    return {
      async onClick() {
        const needReloadDataSources = service?.data?.data.filter((item) => item.status !== 'loaded');
        if (needReloadDataSources?.length) {
          const dataSources = dm.getDataSources();
          const needLoadDataSourceKeys = needReloadDataSources.map((item) => item.key);
          const needLoadDataSourcesInstance = dataSources.filter((item) => needLoadDataSourceKeys.includes(item.key));
          await Promise.all(needLoadDataSourcesInstance.map((item) => item.reload()));
        }
        service?.refresh?.();
      },
    };
  };
  const useDestroyAction = () => {
    const { refresh } = useResourceActionContext();
    const { resource } = useResourceContext();
    const { key: filterByTk } = useRecord();
    return {
      async run() {
        await resource.destroy({ filterByTk });
        dataSourceDeleteCallback([filterByTk]);
        refresh();
      },
    };
  };
  const useIsAbleDelete = ($self) => {
    const { key } = useRecord();
    $self.visible = key !== 'main';
  };
  return (
    <Card bordered={false}>
      <SchemaComponent
        components={{
          CreateDatabaseConnectAction,
          EditDatabaseConnectionAction,
          ViewDatabaseConnectionAction,
        }}
        scope={{
          useNewId: (prefix) => `${prefix}${uid()}`,
          types,
          useRefreshActionProps,
          useDestroyAction,
          dataSourceDeleteCallback,
          dataSourceCreateCallback,
          useIsAbleDelete,
        }}
        schema={databaseConnectionSchema}
      />
    </Card>
  );
};
