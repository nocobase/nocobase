import { css, usePlugin } from '@nocobase/client';
import React from 'react';
import { MobileClientPlugin } from '../index';
import { InterfaceProvider } from './InterfaceProvider';
import { useLocation } from 'react-router-dom';
import { Button } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useTranslation } from '../locale';

export const InterfaceRouter: React.FC = React.memo(() => {
  const plugin = usePlugin(MobileClientPlugin);
  const MobileRouter = plugin.getMobileRouterComponent();

  const location = useLocation();
  const onOpenInNewTab = () => {
    let baseUrl = window.origin;
    if (location.pathname.startsWith('/apps')) {
      baseUrl = window.origin + location.pathname.split('/').slice(0, 3).join('/');
    }
    window.open(`${baseUrl}${location.hash.replace('#', '')}`);
  };
  const { t } = useTranslation();

  return (
    <InterfaceProvider>
      <div
        className={css`
          display: flex;
          width: 100%;
          height: 100%;
          position: relative;
        `}
      >
        <div
          className={css`
            position: absolute;
            top: -40px;
            right: 0;
          `}
        >
          <Button type="dashed" onClick={onOpenInNewTab} icon={<LinkOutlined />}>
            {t('Open in new tab')}
          </Button>
        </div>
        <MobileRouter />
      </div>
    </InterfaceProvider>
  );
});
InterfaceRouter.displayName = 'InterfaceRouter';
