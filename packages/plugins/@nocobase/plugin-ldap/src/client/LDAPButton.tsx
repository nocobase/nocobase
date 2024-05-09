/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LoginOutlined } from '@ant-design/icons';
import { css, useApp } from '@nocobase/client';
import { Authenticator } from '@nocobase/plugin-auth/client';
import { getSubAppName } from '@nocobase/sdk';
import { Button, Space, message } from 'antd';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLdapTranslation } from './locale';

export const LDAPButton = ({ authenticator }: { authenticator: Authenticator }) => {
  const { t } = useLdapTranslation();
  const app = useApp();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');

  const login = async () => {
    const apiBaseURL = app.getOptions().apiClient?.['baseURL'];
    const appName = getSubAppName(app.getPublicPath()) || 'main';

    window.location.replace(
      `${apiBaseURL}ldap:login?authenticator=${authenticator.name}&__appName=${appName}&redirect=${redirect}`,
    );
  };

  useEffect(() => {
    const name = params.get('authenticator');
    const error = params.get('error');
    if (name !== authenticator.name) {
      return;
    }
    if (error) {
      message.error(error);
      return;
    }
  });

  return (
    <Space
      direction="vertical"
      className={css`
        display: flex;
      `}
    >
      <Button shape="round" icon={<LoginOutlined />} onClick={login}>
        {t(authenticator.title)}
      </Button>
    </Space>
  );
};
