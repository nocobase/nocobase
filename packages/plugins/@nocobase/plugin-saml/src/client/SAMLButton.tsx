import { LoginOutlined } from '@ant-design/icons';
import { Authenticator, css, useAPIClient, useRedirect } from '@nocobase/client';
import { Button, Space } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useSamlTranslation } from './locale';

export const SAMLButton = (props: { authenticator: Authenticator }) => {
  const { t } = useSamlTranslation();
  const [windowHandler, setWindowHandler] = useState<Window | undefined>();
  const api = useAPIClient();
  const redirect = useRedirect();

  /**
   * 打开登录弹出框
   */
  const handleOpen = async (name: string) => {
    const response = await api.request({
      method: 'post',
      url: 'saml:getAuthUrl',
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

  const handleSAMLLogin = useCallback(
    async (event: MessageEvent) => {
      try {
        await api.auth.signIn(event.data, event.data?.authenticator);
        redirect();
      } catch (err) {
        console.error(err);
      } finally {
        windowHandler.close();
        setWindowHandler(undefined);
      }
    },
    [api, redirect, windowHandler],
  );

  /**
   * 监听弹出窗口的消息
   */
  useEffect(() => {
    if (!windowHandler) return;

    window.addEventListener('message', handleSAMLLogin);
    return () => {
      window.removeEventListener('message', handleSAMLLogin);
    };
  }, [windowHandler, handleSAMLLogin]);

  const authenticator = props.authenticator;
  return (
    <Space
      direction="vertical"
      className={css`
        display: flex;
      `}
    >
      <Button shape="round" block icon={<LoginOutlined />} onClick={() => handleOpen(authenticator.name)}>
        {t(authenticator.title)}
      </Button>
    </Space>
  );
};
