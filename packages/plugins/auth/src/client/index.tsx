import { SettingsCenterProvider, SigninPageProvider } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Authenticator } from './settings/Authenticator';
import { OptionsSchemaProvider } from '@nocobase/client';
import SigninPage from './basic/SigninPage';
import { presetAuthType } from '../preset';

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
        authType={presetAuthType}
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
        <SigninPageProvider
          authType={presetAuthType}
          allowSignup={true}
          tabTitle={t('Sign in via email')}
          component={SigninPage}
        >
          {props.children}
        </SigninPageProvider>
      </OptionsSchemaProvider>
    </SettingsCenterProvider>
  );
};
