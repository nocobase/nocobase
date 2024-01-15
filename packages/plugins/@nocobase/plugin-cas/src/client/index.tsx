import { Plugin } from '@nocobase/client';
import { SigninPage } from './SigninPage';
import { Options } from './Options';
import { authType } from '../constants';
import AuthPlugin from '@nocobase/plugin-auth/client';

export class SamlPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(authType, {
      components: {
        SignInButton: SigninPage,
        AdminSettingsForm: Options,
      },
    });
  }
}

export default SamlPlugin;
