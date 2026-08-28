/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import PluginAclClientV2 from '@nocobase/plugin-acl/client-v2';

/**
 * Async password validator contributed by another plugin (typically `@nocobase/plugin-password-policy`). Receives the candidate password and an optional `username` (matching v1's `verifyPasswordRules` third argument). Resolve with `null` / `undefined` for valid input, or with the already-translated error message for invalid input — the validator owns its own i18n namespace so consumers don't need to know how to interpolate the policy plugin's `{{n}}` placeholders.
 */
export type PasswordValidator = (value: string, ctx: { username?: string }) => Promise<string | null | undefined>;

export class PluginUsersClientV2 extends Plugin {
  // Registry of cross-plugin password validators. Kept on the plugin instance (rather than a module-level Map) so each `Application` owns its own set and tests can isolate registrations.
  private passwordValidators = new Map<string, PasswordValidator>();

  /**
   * Register a password validator under a stable name. Re-registering the same name overwrites — useful for HMR and for tests that swap in a stub. Downstream plugins should register in their `load()` after `app.pm.get(PluginUsersClientV2)` resolves.
   */
  registerPasswordValidator(name: string, validator: PasswordValidator) {
    this.passwordValidators.set(name, validator);
  }

  unregisterPasswordValidator(name: string) {
    this.passwordValidators.delete(name);
  }

  getPasswordValidators(): PasswordValidator[] {
    return Array.from(this.passwordValidators.values());
  }

  async load() {
    // i18n resources are auto-loaded by v2 buildin `LocalePlugin.afterAdd`; see plugin-password-policy/locale.ts for the full rationale.
    if (!this.pluginSettingsManager.has('users-permissions')) {
      this.pluginSettingsManager.addMenuItem({
        key: 'users-permissions',
        title: this.t('Users & Permissions'),
        isPinned: true,
        sort: 200,
        icon: 'TeamOutlined',
        showTabs: true,
      });
    }
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'users-permissions',
      key: 'users',
      title: this.t('Users'),
      icon: 'UserOutlined',
      aclSnippet: 'pm.users',
      sort: 2,
      componentLoader: () => import('./pages/UsersManagementPage'),
    });
    this.pluginSettingsManager.setPluginSettingsLink('users', 'users-permissions.users');

    const aclPlugin = this.app.pm.get(PluginAclClientV2) as PluginAclClientV2 | undefined;
    aclPlugin?.rolesManager.add('users', {
      title: String(this.t('Users')),
      sort: 10,
      componentLoader: () => import('./pages/RoleUsersManager'),
    });

    this.app.flowEngine.registerModelLoaders({
      EditProfileItemModel: {
        extends: 'UserCenterItemModel',
        loader: () => import('./user-center/EditProfileItemModel'),
      },
      UserPasswordFieldModel: {
        extends: 'PasswordFieldModel',
        loader: () => import('./models/UserPasswordFieldModel'),
      },
      UserRolesSelectFieldModel: {
        extends: 'RecordSelectFieldModel',
        loader: () => import('./models/UserRolesSelectFieldModel'),
      },
      ChangePasswordItemModel: {
        extends: 'UserCenterItemModel',
        loader: () => import('./user-center/ChangePasswordItemModel'),
      },
      CurrentUserSummaryItemModel: {
        extends: 'UserCenterItemModel',
        loader: () => import('./user-center/CurrentUserSummaryItemModel'),
      },
      SignOutItemModel: {
        extends: 'UserCenterItemModel',
        loader: () => import('./user-center/SignOutItemModel'),
      },
    });
  }
}

export default PluginUsersClientV2;
