import React, { useEffect, useState } from 'react';
import { Button, Space } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useAPIClient } from '../api-client';
import { useRedirect } from './SigninPage';

export interface SAMLProvider {
  title: string;
  clientId: string;
  loginUrl: string;
}

export interface OIDCLocation {
  hash: string;
  pathname: string;
  query: {
    authenticator: string;
    clientId: string;
    code: string;
  };
  search: string;
  state: any;
}

export const SAMLList = () => {
  const [list, setList] = useState<SAMLProvider[]>([]);
  const [windowHandler, setWindowHandler] = useState<Window | undefined>();
  const api = useAPIClient();
  const redirect = useRedirect();

  const getSamlList = async () => {
    const { data: pluginsRes } = await api.request({
      url: 'app:getPlugins',
    });
    if (!(pluginsRes.data as string[]).includes('saml')) return;
    const { data: providersRes } = await api.request({
      url: 'samlProviders:list',
      params: {
        filter: {
          'enabled.$eq': true,
        },
      },
    });
    setList(providersRes.data);
  };

  /**
   * 打开登录弹出框
   */
  const handleOpen = async (item: SAMLProvider) => {
    const response = await api.request({
      method: 'post',
      url: 'saml:getAuthUrl',
      data: {
        clientId: item.clientId,
      },
    });

    const authUrl = response?.data?.data;
    const { width, height } = screen;

    const win = window.open(
      authUrl,
      '__blank',
      `width=800,height=600,left=${(width - 800) / 2},top=${
        (height - 600) / 2
      },toolbar=no,menubar=no,location=no,status=no`,
    );

    setWindowHandler(win);
  };

  /**
   * 从弹出窗口，发消息回来进行登录
   */
  const handleOIDCLogin = async (event: MessageEvent) => {
    await api.auth.signIn(event.data, 'saml');
    windowHandler.close();
    setWindowHandler(undefined);
    redirect();
  };

  /**
   * 监听弹出窗口的消息
   */
  useEffect(() => {
    if (!windowHandler) return;
    window.addEventListener('message', handleOIDCLogin);
    return () => {
      window.removeEventListener('message', handleOIDCLogin);
    };
  }, [windowHandler]);

  useEffect(() => {
    getSamlList();
  }, []);

  return (
    <Space
      direction="vertical"
      className={css`
        display: flex;
      `}
    >
      {list.map((item) => (
        <Button shape="round" block key={item.clientId} icon={<LoginOutlined />} onClick={() => handleOpen(item)}>
          SAML: {item.title}
        </Button>
      ))}
    </Space>
  );
};
