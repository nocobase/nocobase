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
  on = 'afterLoad';
  appVersion = '<2.0.0';

  async up() {
    const collection = this.db.getCollection('llmServices');
    if (!collection) {
      return;
    }

    // Check if modelOptions field already exists
    const field = collection.getField('modelOptions');
    if (field) {
      return;
    }

    // Sync the collection to add the new field
    await collection.sync();
  }
}
