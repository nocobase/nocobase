import React from 'react';
import { Card } from 'antd';

import { SchemaComponent } from '@nocobase/client';

import { StorageOptions } from './StorageOptions';
import { storageSchema } from './schemas/storage';

export const FileStoragePane = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent components={{ StorageOptions }} schema={storageSchema} />
    </Card>
  );
};
