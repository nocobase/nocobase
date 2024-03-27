import { Plugin } from '@nocobase/client';
import { RolesManagement } from './RolesManagement';
import { RolesManager } from './roles-manager';

export class PluginACLClient extends Plugin {
  rolesManager = new RolesManager();

  async load() {
    this.pluginSettingsManager.add('users-permissions.roles', {
      title: this.t('Roles & Permissions'),
      icon: 'LockOutlined',
      Component: RolesManagement,
      aclSnippet: 'pm.acl.roles',
      sort: 3,
    });
  }
}

export { RolesManagerContext } from './RolesManagerProvider';
export default PluginACLClient;
