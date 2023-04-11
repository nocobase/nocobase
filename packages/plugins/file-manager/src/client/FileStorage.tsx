import { SchemaComponent } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';
import { StorageOptions } from './StorageOptions';
import { storageSchema } from './schemas/storage';

export const FileStoragePane = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent components={{ StorageOptions }} schema={storageSchema} />
    </Card>
  );
};
