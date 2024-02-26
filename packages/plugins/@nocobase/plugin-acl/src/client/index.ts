import { Plugin } from '@nocobase/client';
import { RolesManagement } from './RolesManagement';
import { RolesManager } from './roles-manager';

class ACLPlugin extends Plugin {
  rolesManager = new RolesManager();

  async load() {
    this.app.pluginSettingsManager.add('users-permissions.roles', {
      title: '{{t("Roles & Permissions")}}',
      icon: 'LockOutlined',
      Component: RolesManagement,
      aclSnippet: 'pm.roles',
      sort: 3,
    });
  }
}

export default ACLPlugin;
export { RolesManagerContext } from './RolesManagerProvider';
