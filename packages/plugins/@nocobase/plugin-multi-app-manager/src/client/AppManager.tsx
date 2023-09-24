import { SchemaComponent, useRecord } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';
import { schema } from './settings/schemas/applications';
import { usePluginUtils } from './utils';

const useLink = () => {
  const record = useRecord();
  if (record.options?.standaloneDeployment && record.cname) {
    return `//${record.cname}`;
  }
  return `/apps/${record.name}/admin/`;
};

const AppVisitor = () => {
  const { t } = usePluginUtils();
  const link = useLink();
  return (
    <a href={link} target={'_blank'} rel="noreferrer">
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
