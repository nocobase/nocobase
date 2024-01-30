import { uid } from '@formily/shared';
import {
  SchemaComponent,
  useCompile,
  usePlugin,
  useResourceActionContext,
  useResourceContext,
  useRecord,
  useCollectionManagerV2,
} from '@nocobase/client';
import { Card } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import PluginDatabaseConnectionsClient from '../';
import { databaseConnectionSchema } from '../schema';
import { CreateDatabaseConnectAction } from './CreateDatabaseConnectAction';
import { EditDatabaseConnectionAction } from './EditDatabaseConnectionAction';
import { ViewDatabaseConnectionAction } from './ViewDatabaseConnectionAction';

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
  const cm = useCollectionManagerV2();

  useEffect(() => {
    return () => {
      cm.reloadThirdDataSource();
    };
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
        refresh();
      },
    };
  };
  return (
    <Card bordered={false}>
      <SchemaComponent
        components={{
          CreateDatabaseConnectAction,
          EditDatabaseConnectionAction,
          ViewDatabaseConnectionAction,
        }}
        scope={{ useNewId: (prefix) => `${prefix}${uid()}`, types, useRefreshActionProps, useDestroyAction }}
        schema={databaseConnectionSchema}
      />
    </Card>
  );
};
