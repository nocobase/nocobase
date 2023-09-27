import { LoginOutlined } from '@ant-design/icons';
import { Authenticator, css, useAPIClient, useCurrentUserContext, useRedirect } from '@nocobase/client';
import { Button, Space } from 'antd';
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
  const { refreshAsync } = useCurrentUserContext();

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
    const state = params.get('state');
    if (!state) {
      return;
    }
    const name = new URLSearchParams(state).get('name');
    if (name !== authenticator.name) {
      return;
    }
    api.auth
      .signIn(params, authenticator.name)
      .then(async () => {
        await refreshAsync();
        redirect();
      })
      .catch((err) => console.log(err));
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
