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
  appVersion = '<1.6.0-alpha.13';
  async up() {
    const { db } = this.context;
    const NodeRepo = db.getRepository('flow_nodes');
    const TaskRepo = db.getRepository('workflowManualTasks');
    await db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        filter: {
          type: 'manual',
        },
        transaction,
      });

      await nodes.reduce(
        (promise, node) =>
          promise.then(() => {
            return TaskRepo.update({
              filter: {
                nodeId: node.id,
              },
              values: {
                title: node.title,
              },
              individualHooks: false,
              silent: true,
              transaction,
            });
          }),
        Promise.resolve(),
      );
    });
  }
}
