/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent, useApp, useRecord } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';
import { schema } from './settings/schemas/applications';
import { usePluginUtils } from './utils';
import { JwtSecretInput } from './JwtSecretInput';

const useLink = () => {
  const record = useRecord();
  const app = useApp();
  if (record.cname) {
    return `//${record.cname}`;
  }
  return app.getRouteUrl(`/apps/${record.name}/admin/`);
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
      <SchemaComponent schema={schema} components={{ AppVisitor, JwtSecretInput }} />
    </Card>
  );
};
