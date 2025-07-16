/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { Migration } from '@nocobase/server';
import { TASK_TYPE_MANUAL } from '../../common/constants';

export default class extends Migration {
  appVersion = '<1.6.0';
  async up() {
    const { db } = this.context;
    const WorkflowTaskModel = db.getModel('workflowTasks');
    const WorkflowManualTaskRepo = db.getRepository('workflowManualTasks');
    await db.sequelize.transaction(async (transaction) => {
      const tasks = await WorkflowManualTaskRepo.find({
        filter: {
          status: JOB_STATUS.PENDING,
          'execution.status': EXECUTION_STATUS.STARTED,
          'workflow.enabled': true,
        },
        transaction,
      });
      const records = tasks.map((item) => ({
        type: TASK_TYPE_MANUAL,
        key: `${item.id}`,
        userId: item.userId,
        workflowId: item.workflowId,
      }));
      for (const record of records) {
        await WorkflowTaskModel.upsert(record, {
          transaction,
        });
      }
    });
  }
}
