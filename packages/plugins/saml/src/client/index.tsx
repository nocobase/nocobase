import { OptionsComponentProvider, PluginManagerContext, SigninPageExtensionProvider } from '@nocobase/client';
import React from 'react';
import { SAMLList } from './SAMLList';
import { Options } from './Options';

export default function (props) {
  return (
    <SigninPageExtensionProvider component={SAMLList}>
      <OptionsComponentProvider authType="SAML" component={Options}>
        {props.children}
      </OptionsComponentProvider>
    </SigninPageExtensionProvider>
  );
}
