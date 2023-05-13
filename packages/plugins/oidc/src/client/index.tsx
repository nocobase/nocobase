import { OptionsComponentProvider, SigninPageExtensionProvider } from '@nocobase/client';
import React from 'react';
import { useOidcTranslation } from './locale';
import { OIDCList } from './OIDCList';
import { authType } from '../constants';
import { Options } from './Options';

export default function (props) {
  const { t } = useOidcTranslation();
  return (
    <SigninPageExtensionProvider component={OIDCList}>
      <OptionsComponentProvider authType={authType} component={Options}>
        {props.children}
      </OptionsComponentProvider>
    </SigninPageExtensionProvider>
  );
}
