import { OptionsComponentProvider, PluginManagerContext, SigninPageExtensionProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { useSamlTranslation } from './locale';
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
