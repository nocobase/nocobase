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
  appVersion = '<0.21.0-alpha.8';

  async up() {
    const roles = await this.db.getRepository('roles').find();
    for (const role of roles) {
      const snippets = await role.get('snippets');
      // update snippets if one of them is named 'pm.database-connections.manager'
      // rename it to 'pm.data-source-manager'
      let roleNeedsUpdate = false;
      for (let i = 0; i < snippets.length; i++) {
        // replace 'pm.database-connections.manager' with 'pm.data-source-manager'
        if (snippets[i].includes('pm.database-connections.manager')) {
          snippets[i] = snippets[i].replace('pm.database-connections.manager', 'pm.data-source-manager');
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
