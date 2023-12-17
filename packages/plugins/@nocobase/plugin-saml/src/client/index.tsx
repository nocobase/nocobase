import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { authType } from '../constants';
import { SAMLButton } from './SAMLButton';
import { Options } from './Options';

export class SamlPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.authPages.register(authType, {
      signIn: {
        display: 'custom',
        Component: SAMLButton,
      },
      configForm: {
        Component: Options,
      },
    });
  }
}

export default SamlPlugin;
