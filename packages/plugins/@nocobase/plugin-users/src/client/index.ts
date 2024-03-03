import { Plugin, tval } from '@nocobase/client';
import { UsersManagement } from './UsersManagement';
import ACLPlugin from '@nocobase/plugin-acl/client';
import { RoleUsersManager } from './RoleUsersManager';

class PluginUsersClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('users-permissions', {
      title: tval('Users & Permissions', { ns: 'users' }),
      icon: 'TeamOutlined',
    });
    this.app.pluginSettingsManager.add('users-permissions.users', {
      title: tval('Users'),
      icon: 'UserOutlined',
      Component: UsersManagement,
      aclSnippet: 'pm.users',
    });

    const acl = this.app.pm.get(ACLPlugin);
    acl.rolesManager.add('users', {
      title: tval('Users'),
      Component: RoleUsersManager,
    });
  }
}

export default PluginUsersClient;
