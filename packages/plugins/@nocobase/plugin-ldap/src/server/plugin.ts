import { Plugin } from '@nocobase/server';
import { authType } from '../constants';
import { LDAPAuth } from './ldap-auth';

export class PluginLdapServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.authManager.registerTypes(authType, {
      auth: LDAPAuth,
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginLdapServer;
