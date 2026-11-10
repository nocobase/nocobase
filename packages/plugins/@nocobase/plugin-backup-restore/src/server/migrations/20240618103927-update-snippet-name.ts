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
      const snippets: unknown = role.get('snippets');
      if (snippets == null) continue;
      if (!Array.isArray(snippets) || !snippets.every((snippet) => typeof snippet === 'string')) {
        this.db.logger.warn('Skipping invalid role snippets during migration', { role: role.get('name') });
        continue;
      }
      const renamed = snippets.map((snippet) => snippet.replace('pm.backup.restore', 'pm.backup-restore'));
      if (renamed.some((snippet, index) => snippet !== snippets[index])) {
        await this.db.getRepository('roles').update({
          filter: {
            name: role.get('name'),
          },
          values: {
            snippets: renamed,
          },
        });
      }
    }
  }
}
