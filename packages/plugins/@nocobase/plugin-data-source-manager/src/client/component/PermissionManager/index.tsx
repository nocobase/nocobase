/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  MenuConfigure,
  ResourceActionProvider,
  SchemaComponent,
  SettingCenterProvider,
  SettingsCenterConfigure,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { createContext } from 'react';
import { DataSourceTable } from './DataSourceTable';
import { RoleRecordProvider } from './PermisionProvider';
import { RoleConfigure } from './RoleConfigure';
import { RolesResourcesActions } from './RolesResourcesActions';
import { StrategyActions } from './StrategyActions';

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

export const DataSourcePermissionManager = ({ role }) => {
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
