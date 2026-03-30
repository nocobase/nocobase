/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { parse } from '@nocobase/utils';

export default class extends Migration {
  appVersion = '<2.0.30';
  async up() {
    const { db } = this.context;

    const NodeRepo = db.getRepository('flow_nodes');
    await db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        filter: {
          type: 'sql',
        },
        transaction,
      });

      await nodes.reduce(
        (promise, node) =>
          promise.then(() => {
            const sql = node.config?.sql || '';
            const template = parse(sql);
            if (!template.parameters?.length) {
              return;
            }
            node.set('config', { ...node.config, unsafeInjection: true });
            node.changed('config', true);
            return node.save({
              silent: true,
              transaction,
            });
          }),
        Promise.resolve(),
      );
    });
  }
}
