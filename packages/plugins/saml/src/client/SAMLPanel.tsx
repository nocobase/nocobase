import React from 'react';
import { uid } from '@formily/shared';
import { SchemaComponent, useRecord } from '@nocobase/client';
import { Card } from 'antd';
import { samlSchema } from './schemas/saml';
import { RedirectURLInput } from './RedirectURLInput';
import { SpEntityIdInput } from './SpEntityIdInput';
import { useSamlTranslation } from './locale';

const schema = {
  type: 'object',
  properties: {
    [uid()]: samlSchema,
  },
};

export const SAMLPanel = () => {
  const { t } = useSamlTranslation();

  return (
    <Card bordered={false}>
      <SchemaComponent components={{ RedirectURLInput, SpEntityIdInput }} schema={schema} scope={{ t }} />
    </Card>
  );
};
