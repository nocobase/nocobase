import React from 'react';
import { uid } from '@formily/shared';
import { SchemaComponent, useRecord } from '@nocobase/client';
import { Card } from 'antd';
import { samlSchema } from './schemas/saml';
import { RedirectURLInput } from './RedirectURLInput';
import { SpEntityIdInput } from './SpEntityIdInput';

const schema = {
  type: 'object',
  properties: {
    [uid()]: samlSchema,
  },
};

export const SAMLPanel = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent components={{ RedirectURLInput, SpEntityIdInput }} schema={schema} />
    </Card>
  );
};
