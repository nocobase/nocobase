import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { SigninPage } from './SigninPage';
import { Options } from './Options';
import { authType } from '../constants';

export class SmsAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(authType, {
      components: {
        SignInForm: SigninPage,
        AdminSettingsForm: Options,
      },
    });
  }
}

export default SmsAuthPlugin;
