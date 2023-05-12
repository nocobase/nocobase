import { OptionsComponentProvider, PluginManagerContext, SigninPageExtensionProvider } from '@nocobase/client';
import React from 'react';
import { SAMLList } from './SAMLList';
import { Options } from './Options';
import { authType } from '../constants';

export default function (props) {
  return (
    <SigninPageExtensionProvider component={SAMLList}>
      <OptionsComponentProvider authType={authType} component={Options}>
        {props.children}
      </OptionsComponentProvider>
    </SigninPageExtensionProvider>
  );
}
