/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Alert, Tooltip } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useApp, useNavigateNoUpdate } from '../application';
import { useRequest } from '../api-client';

export const PluginManagerAccountAlert = () => {
  const { t } = useTranslation();
  const navigate = useNavigateNoUpdate();
  const { data, loading, refresh } = useRequest<any>({
    url: 'pm:useMethod',
  });
  if (data?.data?.method !== 'account') {
    return null;
  }
  return (
    <Alert
      type="warning"
      style={{ marginBottom: '1.2em', alignItems: 'center', marginLeft: 200 }}
      description={
        <div>
          {t(
            'You currently manage plugins using your account password. This has now been updated to an license-based management system. Please refer to the relevant documentation.',
          )}{' '}
        </div>
      }
      action={
        <Button size="middle" type="link">
          {t('Docs')}
        </Button>
      }
    />
  );
};
