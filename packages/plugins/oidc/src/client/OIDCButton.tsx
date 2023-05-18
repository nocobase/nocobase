import { LoginOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Authenticator, useAPIClient, useRedirect } from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import { Button, Space } from 'antd';
import React, { useEffect, useState } from 'react';

export interface OIDCProvider {
  clientId: string;
  title: string;
}

export const OIDCButton = (props: { authenticator: Authenticator }) => {
  const [windowHandler, setWindowHandler] = useState<Window | undefined>();
  const api = useAPIClient();
  const redirect = useRedirect();

  /**
   * 打开登录弹出框
   */
  const handleOpen = async (name: string) => {
    const response = await api.request({
      method: 'post',
      url: 'oidc:getAuthUrl',
      headers: {
        'X-Authenticator': name,
      },
    });

    const authUrl = response?.data?.data;
    const { width, height } = screen;

    const win = window.open(
      authUrl,
      '_blank',
      `width=800,height=600,left=${(width - 800) / 2},top=${
        (height - 600) / 2
      },toolbar=no,menubar=no,location=no,status=no`,
    );

    setWindowHandler(win);
  };

  /**
   * 从弹出窗口，发消息回来进行登录
   */
  const handleOIDCLogin = useMemoizedFn(async (event: MessageEvent) => {
    const { state } = event.data;
    const search = new URLSearchParams(state);
    const authenticator = search.get('name');
    try {
      await api.auth.signIn(event.data, authenticator);
      redirect();
    } catch (err) {
      console.error(err);
    } finally {
      windowHandler.close();
      setWindowHandler(undefined);
    }
  });

  /**
   * 监听弹出窗口的消息
   */
  useEffect(() => {
    if (!windowHandler) return;

    window.addEventListener('message', handleOIDCLogin);
    return () => {
      window.removeEventListener('message', handleOIDCLogin);
    };
  }, [windowHandler, handleOIDCLogin]);

  const authenticator = props.authenticator;
  return (
    <Space
      direction="vertical"
      className={css`
        display: flex;
      `}
    >
      <Button shape="round" block icon={<LoginOutlined />} onClick={() => handleOpen(authenticator.name)}>
        {authenticator.title}
      </Button>
    </Space>
  );
};
