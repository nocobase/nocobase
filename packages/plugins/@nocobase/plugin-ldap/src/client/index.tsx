import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { authType } from '../constants';
import { LDAPButton } from './LDAPButton';
import { Options } from './Options';

export class PluginLdapClient extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(authType, {
      components: {
        AdminSettingsForm: Options,
        SignInButton: LDAPButton,
      },
    });
  }
}

export default PluginLdapClient;
