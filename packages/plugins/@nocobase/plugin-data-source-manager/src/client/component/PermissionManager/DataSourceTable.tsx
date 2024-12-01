/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaComponent,
  SchemaComponentContext,
  SettingCenterPermissionProvider,
  usePlugin,
  useRecord,
  useRequest,
} from '@nocobase/client';
import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import PluginDataSourceManagerClient from '../..';
import { PermissionProvider } from './PermisionProvider';
import { dataSourceSchema } from './schemas/dataSourceTable';

const AvailableActionsContext = createContext([]);
AvailableActionsContext.displayName = 'AvailableActionsContext';

const AvailableActionsProver: React.FC = (props) => {
  const { data, loading } = useRequest<{
    data: any[];
  }>({
    resource: 'availableActions',
    action: 'list',
  });
  if (loading) {
    return <Spin />;
  }
  return <AvailableActionsContext.Provider value={data?.data}>{props.children}</AvailableActionsContext.Provider>;
};

export const useAvailableActions = () => {
  return useContext(AvailableActionsContext);
};

const schemaComponentContext = { designable: false };
export const DataSourceTable = () => {
  const record = useRecord();
  const plugin = usePlugin(PluginDataSourceManagerClient);
  return (
    <div>
      <SchemaComponentContext.Provider value={schemaComponentContext}>
        <AvailableActionsProver>
          <SchemaComponent
            schema={dataSourceSchema(plugin.getExtendedTabs())}
            components={{ SettingCenterPermissionProvider, PermissionProvider }}
            scope={{ dataSourceKey: record.key }}
          />
        </AvailableActionsProver>
      </SchemaComponentContext.Provider>
    </div>
  );
};
