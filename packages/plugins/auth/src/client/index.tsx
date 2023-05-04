import { SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Authenticator } from './settings/Authenticator';

export default (props) => {
  const { t } = useTranslation();
  return (
    <SettingsCenterProvider
      settings={{
        authentication: {
          title: t('Authentication'),
          icon: 'LoginOutlined',
          tabs: {
            authenticators: {
              title: t('Authenticator'),
              component: () => <Authenticator />,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
};
