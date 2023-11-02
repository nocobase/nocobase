import { Authenticator } from '@nocobase/client';
import React, { useEffect } from 'react';
import { LoginOutlined } from '@ant-design/icons';
import { Button, Space, message } from 'antd';
import { useLocation } from 'react-router-dom';
import { getSubAppName } from '@nocobase/sdk';

export const SigninPage = (props: { authenticator: Authenticator }) => {
  const location = useLocation();

  const authenticator = props.authenticator;

  const app = getSubAppName() || 'main';
  const login = async () => {
    window.location.replace(`/api/cas:login?authenticator=${authenticator.name}&__appName=${app}`);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
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
    <Space direction="vertical" style={{ display: 'flex' }}>
      <Button shape="round" block icon={<LoginOutlined />} onClick={login}>
        {authenticator.title}
      </Button>
    </Space>
  );
};
