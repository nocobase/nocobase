import { SettingsCenterProvider } from '@nocobase/client';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppConfiguration, InterfaceConfiguration } from './configuration';
import { isJSBridge } from './core/bridge';
import { useTranslation } from './locale';

export const MobileClientProvider = React.memo((props) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigation = useNavigate();

  useEffect(() => {
    if (isJSBridge() && location.pathname === '/admin') {
      navigation('/mobile', { replace: true });
    }
  }, [location.pathname, navigation]);

  return (
    <SettingsCenterProvider
      settings={{
        ['mobile-client']: {
          title: t('Mobile Client-side'),
          icon: 'MobileOutlined',
          tabs: {
            interface: {
              title: t('Interface Configuration'),
              component: InterfaceConfiguration,
            },
            app: {
              title: t('App Configuration'),
              component: AppConfiguration,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
});
