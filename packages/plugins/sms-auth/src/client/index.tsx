import { SigninPageProvider } from '@nocobase/client';
import React from 'react';
import { SigninPage } from './SigninPage';
import { useAuthTranslation } from './locale';
import { authType } from '../constants';

export default (props) => {
  const { t } = useAuthTranslation();
  return (
    <SigninPageProvider authType={authType} tabTitle={t('Sign in via SMS')} component={SigninPage}>
      {props.children}
    </SigninPageProvider>
  );
};
