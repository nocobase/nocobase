/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SyncSource } from './sync-source';
import { UserData } from './user-data-resource';

export class DefaultSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    this.ctx.log.debug('拉取用户和部门数据');
    this.ctx.log.debug(this.options);
    return [];
  }
}
