/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

const ADMIN_PORTAL_NAME = 'admin';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<3.0.0';

  async up() {
    const repo = this.db.getRepository('aiConversations');
    const rows = await repo.find({});
    let updated = 0;

    for (const row of rows) {
      if (row.get('portalName')) {
        continue;
      }
      await row.update({ portalName: ADMIN_PORTAL_NAME });
      updated += 1;
    }

    if (updated > 0) {
      this.app.logger.info(`Migrated aiConversations.portalName to ${ADMIN_PORTAL_NAME} (${updated})`);
    }
  }
}
