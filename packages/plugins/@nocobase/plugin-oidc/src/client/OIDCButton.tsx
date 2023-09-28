import { LoginOutlined } from '@ant-design/icons';
import { Authenticator, css, useAPIClient, useCurrentUserContext, useRedirect } from '@nocobase/client';
import { Button, Space, message } from 'antd';
import React, { useEffect } from 'react';
import { useOidcTranslation } from './locale';
import { useLocation } from 'react-router-dom';

export interface OIDCProvider {
  clientId: string;
  title: string;
}

export const OIDCButton = ({ authenticator }: { authenticator: Authenticator }) => {
  const { t } = useOidcTranslation();
  const api = useAPIClient();
  const redirect = useRedirect();
  const location = useLocation();
  const { refreshAsync: refresh } = useCurrentUserContext();

  const login = async () => {
    const response = await api.request({
      method: 'post',
      url: 'oidc:getAuthUrl',
      headers: {
        'X-Authenticator': authenticator.name,
      },
    });

    const authUrl = response?.data?.data;
    window.location.replace(authUrl);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const name = params.get('authenticator');
    const error = params.get('error');
    if (name !== authenticator.name) {
      return;
    }
    if (error) {
      message.error(t(error));
      return;
    }
    if (token) {
      api.auth.setToken(token);
      api.auth.setAuthenticator(name);
      refresh()
        .then(() => redirect())
        .catch((err) => console.log(err));
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
