import React from 'react';
import { uid } from '@formily/shared';
import { SchemaComponent, useRecord } from '@nocobase/client';
import { Card } from 'antd';
import { oidcSchema } from './schemas/oidc';
import { RedirectURLInput } from './RedirectURLInput';
import { useOidcTranslation } from './locale';

const schema = {
  type: 'object',
  properties: {
    [uid()]: oidcSchema,
  },
};

export const OIDCPanel = () => {
  const { t } = useOidcTranslation();
  return (
    <Card bordered={false}>
      <SchemaComponent components={{ RedirectURLInput }} schema={schema} scope={{ t }} />
    </Card>
  );
};
