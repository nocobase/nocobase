/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NotificationEntryActionModel as NotificationEntryActionModelV2 } from '../../client-v2/models/NotificationEntryActionModel';
import { inboxVisible } from '../observables';

export class NotificationEntryActionModel extends NotificationEntryActionModelV2 {
  async onClick(event?: unknown) {
    if (this.context.isMobileLayout) {
      await super.onClick(event);
      return;
    }

    inboxVisible.value = true;
  }
}

export default NotificationEntryActionModel;
