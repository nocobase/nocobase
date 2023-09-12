import { AuthenticatorsContext, OptionsComponentProvider, SigninPageExtensionProvider } from '@nocobase/client';
import React, { FC, useContext } from 'react';
import { SAMLButton } from './SAMLButton';
import { Options } from './Options';
import { authType } from '../constants';

export const SamlProvider: FC = (props) => {
  return (
    <SigninPageExtensionProvider component={SAMLButton} authType={authType}>
      <OptionsComponentProvider authType={authType} component={Options}>
        {props.children}
      </OptionsComponentProvider>
    </SigninPageExtensionProvider>
  );
};
