/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import {
  useRequest,
  SchemaComponent,
  SchemaComponentContext,
  SettingCenterPermissionProvider,
  useRecord,
} from '@nocobase/client';
import { dataSourceSchema } from './schemas/dataSourceTable';
import { PermissionProvider } from './PermisionProvider';

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

export const DataSourceTable = () => {
  const record = useRecord();
  return (
    <div>
      <SchemaComponentContext.Provider value={{ designable: false }}>
        <AvailableActionsProver>
          <SchemaComponent
            schema={dataSourceSchema}
            components={{ SettingCenterPermissionProvider, PermissionProvider }}
            scope={{ dataSourceKey: record.key }}
          />
        </AvailableActionsProver>
      </SchemaComponentContext.Provider>
    </div>
  );
};
