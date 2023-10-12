import { Authenticator, useAPIClient, useRedirect, useCurrentUserContext } from '@nocobase/client';
import React, { useEffect } from 'react';
import { LoginOutlined } from '@ant-design/icons';
import { Button, Space, message } from 'antd';
import { useLocation } from 'react-router-dom';
import { getSubAppName } from '@nocobase/sdk';

export const SigninPage = (props: { authenticator: Authenticator }) => {
  const api = useAPIClient();
  const redirect = useRedirect();
  const location = useLocation();
  const { refreshAsync: refresh } = useCurrentUserContext();

  const authenticator = props.authenticator;

  const app = getSubAppName() || 'main';
  const login = async () => {
    window.location.replace(`/api/cas:login?authenticator=${authenticator.name}&__appName=${app}`);
    redirect();
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
      message.error(error);
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
    <Space direction="vertical" style={{ display: 'flex' }}>
      <Button shape="round" block icon={<LoginOutlined />} onClick={login}>
        {authenticator.title}
      </Button>
    </Space>
  );
};
