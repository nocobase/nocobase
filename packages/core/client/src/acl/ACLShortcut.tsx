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
      <SchemaComponent components={components} schema={schema2} />
    </Card>
  );
};
