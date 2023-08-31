import { Authenticator, SchemaComponent, useSignIn, useRecord, useAPIClient, useRedirect } from '@nocobase/client';
import { ISchema } from '@formily/react';
import React, { useEffect } from 'react';
import { LoginOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import Cookies from 'js-cookie';

export const SigninPage = (props: { authenticator: Authenticator }) => {
  const api = useAPIClient();
  const redirect = useRedirect();
  const record = useRecord();
  const authenticator = props.authenticator;
  const casUrl = authenticator.options.casUrl;
  const loctionUrl = authenticator.options.loctionUrl;
  // console.log('==========record===',authenticator)
  const isCasLogin = Boolean(Cookies.get('_sop_session_'));

  const login = async () => {
    Cookies.set('_sop_name_', authenticator.name);
    Cookies.set('_sop_casUrl_', casUrl);
    Cookies.set('_sop_loctionUrl_', loctionUrl);
    if (!api.storage['NOCOBASE_TOKEN'] || !isCasLogin) {
      window.location.replace(`${casUrl}/login?service=${location.origin}/api/cas:getAuthUrl`);
      redirect();
    }
    if (api.storage['NOCOBASE_TOKEN']) {
      await api.auth.signIn({ nickname: 'pages' }, authenticator.name || 's_75h40l1cjvk');
      redirect();
    }
  };

  return (
    <Space direction="vertical" style={{ display: 'flex' }}>
      <Button shape="round" block icon={<LoginOutlined />} onClick={login}>
        {authenticator.title}
      </Button>
    </Space>
  );
};
