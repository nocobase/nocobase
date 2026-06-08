/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACLRolesCheckProvider, Application, Plugin } from '@nocobase/client-v2';
import { ACLSettingsUI, RolesManager } from './registries';

export class PluginAclClientV2 extends Plugin<any, Application> {
  rolesManager = new RolesManager();
  settingsUI = new ACLSettingsUI();

  async load() {
    // i18n resources are auto-loaded by v2 buildin `LocalePlugin.afterAdd`; see plugin-password-policy/locale.ts for the full rationale.
    this.app.use(ACLRolesCheckProvider);

    this.pluginSettingsManager.addMenuItem({
      key: 'users-permissions',
      title: this.t('Users & Permissions'),
      isPinned: true,
      sort: 200,
      icon: 'TeamOutlined',
      showTabs: true,
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'users-permissions',
      key: 'roles',
      title: this.t('Roles & Permissions'),
      icon: 'LockOutlined',
      aclSnippet: 'pm.acl.roles',
      sort: 4,
      componentLoader: () => import('./pages/RolesManagementPage'),
    });
    this.settingsUI.addPermissionsTab({
      key: 'general',
      label: String(this.t('System')),
      sort: 10,
      componentLoader: () => import('./pages/permissions/SystemPermissionsTab'),
    });
    this.settingsUI.addPermissionsTab({
      key: 'menu',
      label: String(this.t('Desktop routes')),
      sort: 20,
      componentLoader: () => import('./pages/permissions/DesktopRoutesPermissionsTab'),
    });

    this.flowEngine.registerModelLoaders({
      UIEditorTopbarActionModel: {
        loader: () => import('@nocobase/client-v2').then((module) => module.UIEditorTopbarActionModel),
      },
      SwitchRoleItemModel: {
        extends: 'UserCenterItemModel',
        loader: () => import('./models/user-center/SwitchRoleItemModel'),
      },
    });
  }
}

export default PluginAclClientV2;
