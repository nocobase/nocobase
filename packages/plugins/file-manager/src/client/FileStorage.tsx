import { uid } from '@formily/shared';
import { SchemaComponent } from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { storageSchema } from './schemas/storage';
import { StorageOptions } from './StorageOptions';

export const FileStoragePane = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <Card bordered={false}>
      <SchemaComponent components={{ StorageOptions }} schema={storageSchema} />
    </Card>
  );
};
