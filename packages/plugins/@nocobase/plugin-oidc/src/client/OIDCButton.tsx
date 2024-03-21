import { LoginOutlined } from '@ant-design/icons';
import { css, useAPIClient } from '@nocobase/client';
import { Button, Space, message } from 'antd';
import React, { useEffect } from 'react';
import { useOidcTranslation } from './locale';
import { useLocation } from 'react-router-dom';
import { Authenticator } from '@nocobase/plugin-auth/client';

export interface OIDCProvider {
  clientId: string;
  title: string;
}

export const OIDCButton = ({ authenticator }: { authenticator: Authenticator }) => {
  const { t } = useOidcTranslation();
  const api = useAPIClient();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');

  const login = async () => {
    const response = await api.request({
      method: 'post',
      url: 'oidc:getAuthUrl',
      headers: {
        'X-Authenticator': authenticator.name,
      },
      data: {
        redirect,
      },
    });

    const authUrl = response?.data?.data;
    window.location.replace(authUrl);
  };

  useEffect(() => {
    const name = params.get('authenticator');
    const error = params.get('error');
    if (name !== authenticator.name) {
      return;
    }
    if (error) {
      message.error(t(error));
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
      <Button shape="round" block icon={<LoginOutlined />} onClick={login}>
        {t(authenticator.title)}
      </Button>
    </Space>
  );
};
