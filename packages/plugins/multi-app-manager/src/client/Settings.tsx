import { SchemaComponent } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';

const schema = {
  type: 'object',
};

export const Settings = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent schema={schema} />
    </Card>
  );
};
