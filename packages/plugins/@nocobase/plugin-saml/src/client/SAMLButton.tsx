import { LoginOutlined } from '@ant-design/icons';
import { Authenticator, css, useAPIClient, useCurrentUserContext, useRedirect } from '@nocobase/client';
import { Button, Space } from 'antd';
import React, { useEffect } from 'react';
import { useSamlTranslation } from './locale';
import { useLocation } from 'react-router-dom';

export const SAMLButton = ({ authenticator }: { authenticator: Authenticator }) => {
  const { t } = useSamlTranslation();
  const api = useAPIClient();
  const redirect = useRedirect();
  const location = useLocation();
  const { refreshAsync } = useCurrentUserContext();

  const login = async () => {
    const response = await api.request({
      method: 'post',
      url: 'saml:getAuthUrl',
      headers: {
        'X-Authenticator': authenticator.name,
      },
    });

    const authUrl = response?.data?.data;
    window.location.replace(authUrl);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('authenticator') !== authenticator.name) {
      return;
    }
    api.auth
      .signIn(params.values, authenticator.name)
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
