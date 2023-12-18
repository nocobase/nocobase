import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { authType } from '../constants';
import { OIDCButton } from './OIDCButton';
import { Options } from './Options';

export class OidcPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(authType, {
      components: {
        SignInButton: OIDCButton,
        AdminSettingsForm: Options,
      },
    });
  }
}

export default OidcPlugin;
