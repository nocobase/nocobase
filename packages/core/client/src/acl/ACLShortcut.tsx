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
import { Card } from 'antd';
import React from 'react';
import { SchemaComponent } from '../schema-component';
import * as components from './Configuration';

const schema2: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'RoleTable',
    },
  },
};

export const ACLPane = () => {
  return (
    <Card data-testid="acl-pane-card" bordered={false}>
      <SchemaComponent components={components as any} schema={schema2} />
    </Card>
  );
};
