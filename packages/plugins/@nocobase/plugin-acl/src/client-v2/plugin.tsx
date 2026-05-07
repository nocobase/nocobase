/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ACLRolesCheckProvider,
  Plugin,
  UIEditorTopbarActionModel,
  UserCenterSelectItemModel,
} from '@nocobase/client-v2';
import { aclLocaleResources } from './locale';

class SwitchRoleItemModel extends UserCenterSelectItemModel {
  static itemId = 'switch-role';

  section = 'preferences' as const;
  sort = 300;
  label = 'Switch role';

  async prepare() {
    const userRoles = Array.isArray(this.context.user?.roles) ? this.context.user.roles : [];
    const roleMode = this.context.acl?.data?.roleMode;
    const currentRole = this.context.api.auth.role;
    const roles = [...userRoles];

    if (roleMode === 'allow-use-union') {
      roles.unshift({
        name: '__union__',
        title: this.context.t('Full permissions', { ns: '@nocobase/plugin-acl' }),
      });
    }

    this.options = roles.map((role: any) => ({
      value: role.name,
      label: role.title || role.name,
    }));
    this.value = currentRole || this.options[0]?.value;
    this.ready = this.options.length > 1 && roleMode !== 'only-use-union';
  }

  async onChange(value: string) {
    this.context.api.auth.setRole(value);
    await this.context.api.resource('users').setDefaultRole({ values: { roleName: value } });
    window.location.reload();
  }
}

export class PluginAclClientV2 extends Plugin {
  async load() {
    Object.entries(aclLocaleResources).forEach(([lang, resource]) => {
      this.app.i18n.addResources(lang, this.options?.['packageName'] || '@nocobase/plugin-acl', resource);
    });

    this.app.use(ACLRolesCheckProvider);
    this.app.flowEngine.registerModels({
      UIEditorTopbarActionModel,
      SwitchRoleItemModel,
    });
  }
}

export default PluginAclClientV2;
