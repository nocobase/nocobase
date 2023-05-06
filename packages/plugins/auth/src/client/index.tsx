import { SettingsCenterProvider, SigninPageProvider, SignupPageProvider } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Authenticator } from './settings/Authenticator';
import { OptionsComponentProvider } from '@nocobase/client';
import SigninPage from './basic/SigninPage';
import { presetAuthType } from '../preset';
import SignupPage from './basic/SignupPage';
import { Options } from './basic/Options';

export default (props) => {
  const { t } = useTranslation();
  return (
    <SettingsCenterProvider
      settings={{
        auth: {
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
      <OptionsComponentProvider authType={presetAuthType} component={Options}>
        <SigninPageProvider
          authType={presetAuthType}
          allowSignup={true}
          tabTitle={t('Sign in via email')}
          component={SigninPage}
        >
          <SignupPageProvider authType={presetAuthType} component={SignupPage}>
            {props.children}
          </SignupPageProvider>
        </SigninPageProvider>
      </OptionsComponentProvider>
    </SettingsCenterProvider>
  );
};
