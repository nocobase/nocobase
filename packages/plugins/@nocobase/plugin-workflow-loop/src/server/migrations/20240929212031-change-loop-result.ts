/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const { db, app } = this.context;
    const JobRepo = db.getRepository('jobs');
    await db.sequelize.transaction(async (transaction) => {
      const records = await JobRepo.find({
        filter: {
          node: {
            type: 'loop',
          },
        },
        transaction,
      });

      app.logger.debug(`${records.length} records need to be migrated.`);

      for (const record of records) {
        const { result } = record;
        if (typeof result === 'number') {
          await record.update({ result: { looped: result } }, { transaction });
        }
      }
    });
  }
}
