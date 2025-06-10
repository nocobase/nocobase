/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

const UnitOptions = [604800_000, 86400_000, 3600_000, 60_000, 1_000];

function getNumberOption(v) {
  return UnitOptions.find((item) => !(v % item));
}

export default class extends Migration {
  appVersion = '<1.7.0';
  async up() {
    const { db } = this.context;

    const NodeRepo = db.getRepository('flow_nodes');
    await db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        filter: {
          type: 'delay',
        },
        transaction,
      });

      await nodes.reduce(
        (promise, node) =>
          promise.then(async () => {
            if (node.config.unit) {
              return;
            }
            if (!node.config.duration) {
              return;
            }
            const unit = getNumberOption(node.config.duration);
            const duration = node.config.duration / unit;
            node.set('config', { ...node.config, duration, unit });
            node.changed('config', true);
            await node.save({
              silent: true,
              transaction,
            });
          }),
        Promise.resolve(),
      );
    });
  }
}
