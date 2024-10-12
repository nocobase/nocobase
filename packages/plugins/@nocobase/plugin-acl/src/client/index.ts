/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { ACLSettingsUI } from './ACLSettingsUI';
import { RolesManagement } from './RolesManagement';
import { RolesManager } from './roles-manager';

export class PluginACLClient extends Plugin {
  rolesManager = new RolesManager();
  settingsUI = new ACLSettingsUI();

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
