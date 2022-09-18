import { uid } from '@formily/shared';
import { Card } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponent } from '../schema-component';
import { storageSchema } from './schemas/storage';
import { StorageOptions } from './StorageOptions';

const schema = {
  type: 'object',
  properties: {
    [uid()]: storageSchema,
  },
};

export const FileStoragePane = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <Card bordered={false}>
      <SchemaComponent components={{ StorageOptions }} schema={schema} />
    </Card>
  );
};

// WZvC&6cR8@aAJu!
