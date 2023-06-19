import { OptionsComponentProvider, SigninPageProvider } from '@nocobase/client';
import React from 'react';
import { SigninPage } from './SigninPage';
import { useAuthTranslation } from './locale';
import { authType } from '../constants';
import { Options } from './Options';

export const SmsAuthProvider = (props) => {
  const { t } = useAuthTranslation();
  return (
    <OptionsComponentProvider authType={authType} component={Options}>
      <SigninPageProvider authType={authType} tabTitle={t('Sign in via SMS')} component={SigninPage}>
        {props.children}
      </SigninPageProvider>
    </OptionsComponentProvider>
  );
};
