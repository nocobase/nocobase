import React from 'react';
import { uid } from '@formily/shared';
import { SchemaComponent, useRecord } from '@nocobase/client';
import { Card } from 'antd';
import { oidcSchema } from './schemas/oidc';
import { RedirectURLInput } from './RedirectURLInput';

const schema = {
  type: 'object',
  properties: {
    [uid()]: oidcSchema,
  },
};

export const OIDCPanel = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent components={{ RedirectURLInput }} schema={schema} />
    </Card>
  );
};
