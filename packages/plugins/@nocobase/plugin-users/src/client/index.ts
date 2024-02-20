import { Plugin, tval } from '@nocobase/client';
import { UsersManagement } from './UsersManagement';
import ACLPlugin from '@nocobase/plugin-acl/client';
import { RoleUsersManager } from './RoleUsersManager';

class UsersPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('organization', {
      title: tval('Organization', { ns: 'users' }),
      icon: 'TeamOutlined',
    });
    this.app.pluginSettingsManager.add('organization.users', {
      title: tval('Users'),
      icon: 'UserOutlined',
      Component: UsersManagement,
      aclSnippet: 'pm.orgnaization.users',
    });

    const acl = this.app.pm.get(ACLPlugin);
    acl.rolesManager.add('users', {
      title: tval('Users'),
      Component: RoleUsersManager,
    });
  }
}

export default PluginUsersClient;
