import { uid } from '@formily/shared';
import {
  SchemaComponent,
  useCompile,
  usePlugin,
  useResourceActionContext,
  useResourceContext,
  useRecord,
  useDataSourceManagerV2,
} from '@nocobase/client';
import { Card } from 'antd';
import _ from 'lodash';
import { useField } from '@formily/react';
import React, { useCallback, useEffect } from 'react';
import PluginDatabaseConnectionsClient from '../';
import { databaseConnectionSchema } from '../schema';
import { CreateDatabaseConnectAction } from './CreateDatabaseConnectAction';
import { EditDatabaseConnectionAction } from './EditDatabaseConnectionAction';
import { ViewDatabaseConnectionAction } from './ViewDatabaseConnectionAction';
import { ThirdDataSource } from '../ThridDataSource';

export const DatabaseConnectionManagerPane = () => {
  const compile = useCompile();
  const plugin = usePlugin(PluginDatabaseConnectionsClient);
  const types = [...plugin.types.keys()].map((key) => {
    const type = plugin.types.get(key);
    return {
      value: key,
      label: compile(type?.label),
    };
  });

  const dm = useDataSourceManagerV2();

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

  const dataSourceCreateCallback = useCallback((data: any) => {
    dm.addDataSource(ThirdDataSource, data);
    reloadKeys.current = [...reloadKeys.current, data.key];
  }, []);

  const useRefreshActionProps = () => {
    const service = useResourceActionContext();
    return {
      async onClick() {
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
