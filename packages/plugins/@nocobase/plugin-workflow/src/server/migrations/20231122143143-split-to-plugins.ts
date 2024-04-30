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
  appVersion = '<0.17.0-alpha.4';
  async up() {
    const match = await this.app.version.satisfies('<0.17.0-alpha.4');
    if (!match) {
      return;
    }
    const { db } = this.context;

    const NodeRepo = db.getRepository('flow_nodes');
    await db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        transaction,
      });

      await nodes.reduce(
        (promise, node) =>
          promise.then(() => {
            if (node.type === 'calculation' && node.config.dynamic) {
              node.set({
                type: 'dynamic-calculation',
                config: {
                  expression: node.config.dynamic,
                  scope: node.config.scope,
                },
              });
              node.changed('config', true);
            }

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
