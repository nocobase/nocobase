import { OptionsComponentProvider, SigninPageProvider, SignupPageProvider } from '@nocobase/client';
import React, { FC } from 'react';
import SigninPage from './basic/SigninPage';
import { presetAuthType } from '../preset';
import SignupPage from './basic/SignupPage';
import { useAuthTranslation } from './locale';
import { Options } from './basic/Options';

export const AuthProvider: FC = (props) => {
  const { t } = useAuthTranslation();
  return (
    <OptionsComponentProvider authType={presetAuthType} component={Options}>
      <SigninPageProvider authType={presetAuthType} tabTitle={t('Sign in via password')} component={SigninPage}>
        <SignupPageProvider authType={presetAuthType} component={SignupPage}>
          {props.children}
        </SignupPageProvider>
      </SigninPageProvider>
    </OptionsComponentProvider>
  );
};
