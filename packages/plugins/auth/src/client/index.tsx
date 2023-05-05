import { SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Authenticator } from './settings/Authenticator';
import { OptionsSchemaProvider } from './settings/Configure';

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
      <OptionsSchemaProvider
        authType="email/password"
        schema={{
          type: 'object',
          properties: {
            secret: {
              title: 'JWT Secret',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
            expireIn: {
              title: '{{t("Expire In",{ns:"auth"})}}',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
          },
        }}
      >
        {props.children}
      </OptionsSchemaProvider>
    </SettingsCenterProvider>
  );
};
