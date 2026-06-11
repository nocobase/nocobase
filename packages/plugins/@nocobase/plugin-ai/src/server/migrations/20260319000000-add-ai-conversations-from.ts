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
  appVersion = '<2.1.0';

  async up() {
    const collection = this.db.getCollection('aiConversations');
    if (!collection) {
      return;
    }

    const field = collection.getField('from');
    if (!field) {
      await collection.sync();
    }

    const repo = this.db.getRepository('aiConversations');
    const rows = await repo.find({});
    let updated = 0;

    for (const row of rows) {
      const value = row.get?.('from') ?? row.from;
      if (value) {
        continue;
      }
      await row.update({
        from: 'main-agent',
      });
      updated += 1;
    }

    if (updated > 0) {
      this.app.logger.info(`Migrated aiConversations.from to main-agent (${updated})`);
    }
  }
}
