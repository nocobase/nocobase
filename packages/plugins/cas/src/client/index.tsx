import { OptionsComponentProvider, SigninPageExtensionProvider, SignupPageProvider } from '@nocobase/client';
import React from 'react';
import { Plugin } from '@nocobase/client';

import { SigninPage } from './SigninPage';
import { Options } from './Options';
import { authType } from '../constants';

export function CASProvider(props) {
  return (
    <OptionsComponentProvider authType={authType} component={Options}>
      <SigninPageExtensionProvider authType={authType} component={SigninPage}>
        {props.children}
      </SigninPageExtensionProvider>
    </OptionsComponentProvider>
  );
}

export class SamlPlugin extends Plugin {
  async load() {
    this.app.use(CASProvider);
  }
}

export default SamlPlugin;
