import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Card } from 'antd';
import React from 'react';
import {
  SchemaComponent,
  MenuConfigure,
  SettingsCenterConfigure,
  SettingCenterProvider,
  ResourceActionProvider,
} from '@nocobase/client';
import { RoleTable } from './RoleTable';
import { RoleConfigure } from './RoleConfigure';
import { StrategyActions } from './StrategyActions';
import { RolesResourcesActions } from './RolesResourcesActions';

const schema2: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'RoleTable',
    },
  },
};

export const PermissionManager = () => {
  return (
    <Card data-testid="acl-pane-card" bordered={false}>
      <SchemaComponent
        components={{
          MenuConfigure,
          RoleConfigure,
          RolesResourcesActions,
          RoleTable,
          StrategyActions,
          SettingsCenterConfigure,
          SettingCenterProvider,
          ResourceActionProvider,
        }}
        schema={schema2}
      />
    </Card>
  );
};
