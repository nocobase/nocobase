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
  appVersion = '<1.7.0';
  on = 'afterLoad';
  async up() {
    const { db } = this.context;

    const WorkflowRepo = db.getRepository('workflows');
    const WorkflowStatsModel = db.getModel('workflowStats');
    const WorkflowVersionStatsModel = db.getModel('workflowVersionStats');
    await db.sequelize.transaction(async (transaction) => {
      const workflows = await WorkflowRepo.find({
        fields: ['id', 'key', 'executed', 'allExecuted'],
        transaction,
      });

      const groupCounts: { [key: string]: { key: string; executed: number } } = {};
      for (const workflow of workflows) {
        const versionStats = await WorkflowVersionStatsModel.findOne({
          where: {
            id: workflow.id,
          },
          transaction,
        });
        if (!versionStats) {
          await WorkflowVersionStatsModel.create(
            {
              id: workflow.id,
              executed: workflow.get('executed'),
            },
            { transaction },
          );
        }

        const key = workflow.get('key');
        groupCounts[key] = {
          key,
          executed: workflow.get('allExecuted') || 0,
        };
      }
      for (const values of Object.values(groupCounts)) {
        const stats = await WorkflowStatsModel.findOne({
          where: {
            key: values.key,
          },
          transaction,
        });
        if (!stats) {
          await WorkflowStatsModel.create(values, { transaction });
        }
      }
    });
  }
}
