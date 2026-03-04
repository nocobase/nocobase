/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<2.1.0';

  async up() {
    if (!this.db.isMySQLCompatibleDialect()) {
      return;
    }

    await this.alterBlobField('lcCheckpointWrites', 'blob');
    await this.alterBlobField('lcCheckpointBlobs', 'blob');
  }

  async alterBlobField(collectionName: string, fieldName: string) {
    const collection = this.db.getCollection(collectionName);
    if (!collection) {
      return;
    }

    const field = collection.getField(fieldName);
    if (!field) {
      return;
    }

    if (field.options?.length !== 'long') {
      return;
    }

    await collection.sync({
      force: false,
      alter: true,
    });
    this.app.log.info(`alter collection [${collectionName}] field [${fieldName}]`);
  }
}
