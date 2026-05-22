/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getCurrentV2RedirectPath,
  Plugin,
  redirectToV2Signin,
  resolveV2SigninRedirect,
  UserCenterActionItemModel,
  UserCenterTextItemModel,
} from '@nocobase/client-v2';
import { ChangePasswordItemModel } from './user-center/ChangePasswordItemModel';

class CurrentUserSummaryItemModel extends UserCenterTextItemModel {
  static itemId = 'current-user-summary';

  section = 'profile' as const;
  sort = 0;

  async prepare() {
    const user = this.context.user || {};
    this.label = user.nickname || user.username || user.email || '';
    this.value = undefined;
    this.description = undefined;
    this.ready = Boolean(this.label);
  }
}

class SignOutItemModel extends UserCenterActionItemModel {
  static itemId = 'sign-out';

  section = 'danger' as const;
  sort = 1000;
  label = 'Sign out';

  async onClick() {
    const response = await this.context.api.auth.signOut();
    const redirect = resolveV2SigninRedirect(response?.data?.data?.redirect, this.context.app);

    if (redirect) {
      window.location.replace(redirect);
      return;
    }

    redirectToV2Signin(this.context.app, getCurrentV2RedirectPath(this.context.app, window.location), {
      replace: true,
    });
  }
}

/**
 * Async password validator contributed by another plugin (typically
 * `@nocobase/plugin-password-policy`). Receives the candidate password
 * and an optional `username` (matching v1's `verifyPasswordRules` third
 * argument). Resolve with `null` / `undefined` for valid input, or with
 * the already-translated error message for invalid input — the validator
 * owns its own i18n namespace so consumers don't need to know how to
 * interpolate the policy plugin's `{{n}}` placeholders.
 */
export type PasswordValidator = (value: string, ctx: { username?: string }) => Promise<string | null | undefined>;

export class PluginUsersClientV2 extends Plugin {
  // Registry of cross-plugin password validators. Kept on the plugin
  // instance (rather than a module-level Map) so each `Application`
  // owns its own set and tests can isolate registrations.
  private passwordValidators = new Map<string, PasswordValidator>();

  /**
   * Register a password validator under a stable name. Re-registering
   * the same name overwrites — useful for HMR and for tests that swap
   * in a stub. Downstream plugins should register in their `load()`
   * after `app.pm.get(PluginUsersClientV2)` resolves.
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
    // i18n resources are auto-loaded by v2 buildin `LocalePlugin.afterAdd`;
    // see plugin-password-policy/locale.ts for the full rationale.
    this.app.flowEngine.registerModels({
      ChangePasswordItemModel,
      CurrentUserSummaryItemModel,
      SignOutItemModel,
    });
  }
}

export default PluginUsersClientV2;
