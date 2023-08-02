import {
  OptionsComponentProvider,
  SettingsCenterProvider,
  SigninPageProvider,
  SignupPageProvider,
} from '@nocobase/client';
import React, { FC } from 'react';
import { Authenticator } from './settings/Authenticator';
import SigninPage from './basic/SigninPage';
import { presetAuthType } from '../preset';
import SignupPage from './basic/SignupPage';
import { useAuthTranslation } from './locale';
import { Options } from './basic/Options';

export const AuthProvider: FC = (props) => {
  const { t } = useAuthTranslation();
  return (
    <SettingsCenterProvider
      settings={{
        auth: {
          title: t('Authentication'),
          icon: 'LoginOutlined',
          tabs: {
            authenticators: {
              title: t('Authenticators'),
              component: () => <Authenticator />,
            },
          },
        },
      }}
    >
      <OptionsComponentProvider authType={presetAuthType} component={Options}>
        <SigninPageProvider authType={presetAuthType} tabTitle={t('Sign in via password')} component={SigninPage}>
          <SignupPageProvider authType={presetAuthType} component={SignupPage}>
            {props.children}
          </SignupPageProvider>
        </SigninPageProvider>
      </OptionsComponentProvider>
    </SettingsCenterProvider>
  );
};
