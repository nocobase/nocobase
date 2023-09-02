import { Authenticator, useAPIClient, useRedirect, useCurrentUserContext } from '@nocobase/client';
import React, { useEffect } from 'react';
import { LoginOutlined } from '@ant-design/icons';
import { Button, Space, App } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

export const SigninPage = (props: { authenticator: Authenticator }) => {
  const { message } = App.useApp();
  const api = useAPIClient();
  const navigate = useNavigate();
  const redirect = useRedirect();
  const location = useLocation();
  const { refreshAsync } = useCurrentUserContext();

  const authenticator = props.authenticator;

  const login = async () => {
    window.location.replace(`/api/cas:login?authenticator=${authenticator.name}`);
    redirect();
  };

  useEffect(() => {
    const usp = new URLSearchParams(location.search);
    if (usp.get('authenticator') === authenticator.name) {
      api.auth
        .signIn({}, authenticator.name)
        .then(async () => {
          await refreshAsync();
          redirect();
        })
        .catch((error) => {
          navigate({
            pathname: location.pathname,
          });
          message.error(error.message);
        });
    }
  }, [location.search, authenticator.name]);

  return (
    <Space direction="vertical" style={{ display: 'flex' }}>
      <Button shape="round" block icon={<LoginOutlined />} onClick={login}>
        {authenticator.title}
      </Button>
    </Space>
  );
};
