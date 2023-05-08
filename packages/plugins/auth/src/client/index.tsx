import { SettingsCenterProvider, SigninPageProvider, SignupPageProvider } from '@nocobase/client';
import React from 'react';
import { Authenticator } from './settings/Authenticator';
import SigninPage from './basic/SigninPage';
import { presetAuthType } from '../preset';
import SignupPage from './basic/SignupPage';
import { useAuthTranslation } from './locale';

export default (props) => {
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
      {/* <OptionsComponentProvider authType={presetAuthType} component={Options}> */}
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
      {/* </OptionsComponentProvider> */}
    </SettingsCenterProvider>
  );
};
