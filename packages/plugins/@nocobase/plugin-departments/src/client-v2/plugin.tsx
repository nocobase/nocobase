/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { Plugin } from '@nocobase/client-v2';
import PluginAclClientV2 from '@nocobase/plugin-acl/client-v2';

export class PluginDepartmentsClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    if (!this.pluginSettingsManager.has('users-permissions')) {
      this.pluginSettingsManager.addMenuItem({
        key: 'users-permissions',
        title: this.t('Users & Permissions'),
        isPinned: true,
        sort: 200,
        icon: 'TeamOutlined',
      });
    }

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'users-permissions',
      key: 'departments',
      title: this.t('Departments'),
      icon: 'ApartmentOutlined',
      sort: 3,
      aclSnippet: 'pm.departments',
      componentLoader: () => import('./pages/DepartmentsPage'),
    });
    this.pluginSettingsManager.setPluginSettingsLink('departments', 'users-permissions.departments');

    const aclPlugin = this.app.pm.get(PluginAclClientV2) as PluginAclClientV2 | undefined;
    aclPlugin?.rolesManager.add('departments', {
      title: String(this.t('Departments')),
      sort: 20,
      componentLoader: () => import('./pages/RoleDepartmentsManager'),
    });
  }
}

export default PluginDepartmentsClientV2;
