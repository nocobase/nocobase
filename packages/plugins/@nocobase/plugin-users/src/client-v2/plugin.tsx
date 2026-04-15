/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, UserCenterActionItemModel, UserCenterTextItemModel } from '@nocobase/client-v2';
import { usersLocaleResources } from './locale';

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
    const redirect = response?.data?.data?.redirect;

    if (redirect) {
      window.location.href = redirect;
      return;
    }

    const target = this.context.app.getHref(`signin?redirect=${encodeURIComponent('')}`);
    window.location.href = target;
  }
}

export class PluginUsersClientV2 extends Plugin {
  async load() {
    Object.entries(usersLocaleResources).forEach(([lang, resource]) => {
      this.app.i18n.addResources(lang, this.options?.packageName || '@nocobase/plugin-users', resource);
    });

    this.app.flowEngine.registerModels({
      CurrentUserSummaryItemModel,
      SignOutItemModel,
    });
  }
}

export default PluginUsersClientV2;
