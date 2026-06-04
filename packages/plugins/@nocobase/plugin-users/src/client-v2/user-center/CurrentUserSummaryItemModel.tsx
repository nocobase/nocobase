/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UserCenterTextItemModel } from '@nocobase/client-v2';

export class CurrentUserSummaryItemModel extends UserCenterTextItemModel {
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

export default CurrentUserSummaryItemModel;
