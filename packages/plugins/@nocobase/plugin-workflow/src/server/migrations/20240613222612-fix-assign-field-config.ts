/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  async up() {
    const { db } = this.context;

    const NodeRepo = db.getRepository('flow_nodes');
    await db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        filter: {
          type: {
            [Op.or]: ['create', 'update'],
          },
        },
      });
      for (const node of nodes) {
        if (node.usingAssignFormSchema || !node.assignFormSchema) {
          continue;
        }
        node.set({
          config: { ...node.config, usingAssignFormSchema: true },
        });
        node.changed('config');
        await node.save({
          silent: true,
          transaction,
        });
      }
    });
  }
}
