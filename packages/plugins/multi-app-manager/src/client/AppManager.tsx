import { SchemaComponent, useRecord } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';
import { schema } from './settings/schemas/applications';

const AppVisitor = () => {
  const record = useRecord();
  return (
    <a href={`/apps/${record.name}/admin/`} target={'_blank'}>
      View
    </a>
  );
};

export const AppManager = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent schema={schema} components={{ AppVisitor }} />
    </Card>
  );
};
