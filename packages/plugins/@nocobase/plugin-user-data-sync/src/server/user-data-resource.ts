/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SyncSource } from './sync-source';

export interface IUserDataResource {
  accepts: ('user' | 'department')[];
  updateOrCreate(data: UserData);
}

export type UserData = {
  type: 'user' | 'department';
  uniqueKey: string;
  data: any[];
  source: SyncSource;
};
