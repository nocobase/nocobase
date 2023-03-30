import { SchemaComponent, useRecord } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';
import { schema } from './settings/schemas/applications';
import { usePluginUtils } from './utils';

const AppVisitor = () => {
  const record = useRecord();
  const { t } = usePluginUtils();
  return (
    <a href={`/apps/${record.name}/admin/`} target={'_blank'}>
      {t('View', { ns: 'client' })}
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
