/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { OriginRecord, SyncAccept, UserDataResource } from '../user-data-resource-manager';

export class MockUsersResource extends UserDataResource {
  name = 'mock-users';
  accepts: SyncAccept[] = ['user'];
  data = [];

  async update(record: OriginRecord, resourcePk: number) {
    this.data[resourcePk] = record.metaData;
  }

  async create(record: OriginRecord) {
    this.data.push(record.metaData);
    return this.data.length - 1;
  }
}

export class ErrorResource extends UserDataResource {
  async update() {}
  async create() {
    return 0;
  }
}
