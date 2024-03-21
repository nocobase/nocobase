import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Card } from 'antd';
import React, { createContext } from 'react';
import {
  SchemaComponent,
  MenuConfigure,
  SettingsCenterConfigure,
  SettingCenterProvider,
  ResourceActionProvider,
} from '@nocobase/client';
import { DataSourceTable } from './DataSourceTable';
import { RoleConfigure } from './RoleConfigure';
import { StrategyActions } from './StrategyActions';
import { RolesResourcesActions } from './RolesResourcesActions';
import { RoleRecordProvider } from './PermisionProvider';

const schema2: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'DataSourceTable',
    },
  },
};

export const CurrentRolesContext = createContext<any>({} as any);
CurrentRolesContext.displayName = 'CurrentRolesContext';

export const DataSourcePermissionManager = ({ role }: any) => {
  return (
    <Card data-testid="acl-pane-card" bordered={false}>
      <CurrentRolesContext.Provider value={role}>
        <SchemaComponent
          components={{
            MenuConfigure,
            RoleConfigure,
            RolesResourcesActions,
            DataSourceTable,
            StrategyActions,
            SettingsCenterConfigure,
            SettingCenterProvider,
            ResourceActionProvider,
            RoleRecordProvider,
          }}
          schema={schema2}
        />
      </CurrentRolesContext.Provider>
    </Card>
  );
};
