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
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.2.4-alpha';

  async up() {
    const roles = await this.db.getRepository('roles').find();
    for (const role of roles) {
      const snippets = await role.get('snippets');
      let roleNeedsUpdate = false;
      for (let i = 0; i < snippets.length; i++) {
        if (snippets[i].includes('pm.backup.restore')) {
          snippets[i] = snippets[i].replace('pm.backup.restore', 'pm.backup-restore');
          roleNeedsUpdate = true;
        }
      }

      if (roleNeedsUpdate) {
        await this.db.getRepository('roles').update({
          filter: {
            name: role.get('name'),
          },
          values: {
            snippets: JSON.parse(JSON.stringify(snippets)),
          },
        });
      }
    }
  }
}
