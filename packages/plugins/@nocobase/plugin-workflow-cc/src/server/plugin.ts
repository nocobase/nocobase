/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Model, type Transaction } from '@nocobase/database';

import PluginWorkflowServer, { TaskStatsRow } from '@nocobase/plugin-workflow';
import CCInstruction from './CCInstruction';
import { TASK_STATUS, TASK_TYPE_CC } from '../common/constants';
import { initActions } from './actions';

export class PluginWorkflowCCServer extends Plugin {
  private getWorkflowKeyFromIncluded(row: Model) {
    const workflow = row.get('workflow') as Model | undefined;
    return workflow?.get('key') as string | undefined;
  }

  private async getWorkflowKeyById(workflowId: number, transaction?: Transaction) {
    const WorkflowRepo = this.db.getRepository('workflows');
    const workflow = await WorkflowRepo.findOne({
      filterByTk: workflowId,
      fields: ['key'],
      transaction,
    });
    return workflow?.key as string | undefined;
  }

  private async collectCcTaskStats(options: {
    userIds?: number[];
    workflowKeys?: string[];
    transaction?: Transaction;
  }): Promise<TaskStatsRow[]> {
    const workflowPlugin = this.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
    const CCModel = this.db.getModel('workflowCcTasks');
    const where: Record<string, unknown> = {};
    if (options.userIds?.length) {
      where.userId = options.userIds;
    }
    if (options.workflowKeys?.length) {
      const workflowIds = (
        await Promise.all(
          options.workflowKeys.map((workflowKey) =>
            workflowPlugin.getWorkflowIdsByKey(workflowKey, options.transaction),
          ),
        )
      ).flat();
      if (!workflowIds.length) {
        return [];
      }
      where.workflowId = workflowIds;
    }

    const rows = await CCModel.findAll({
      attributes: ['userId', 'workflowId', 'status'],
      where,
      include: [
        {
          association: 'workflow',
          attributes: ['key'],
          required: true,
        },
      ],
      transaction: options.transaction,
    });
    const statsMap = new Map<string, TaskStatsRow>();
    for (const row of rows) {
      const userId = row.get('userId') as number | undefined;
      const workflowKey = this.getWorkflowKeyFromIncluded(row);
      if (!userId || !workflowKey) {
        continue;
      }
      const key = `${userId}\0${workflowKey}`;
      const stats = statsMap.get(key) ?? {
        userId,
        workflowKey,
        type: TASK_TYPE_CC,
        pending: 0,
        all: 0,
      };
      stats.all += 1;
      if (row.get('status') === TASK_STATUS.UNREAD) {
        stats.pending += 1;
      }
      statsMap.set(key, stats);
    }

    return Array.from(statsMap.values());
  }

  onRecordSave = async (record: Model, { transaction }) => {
    const userId = record.get('userId') as number | undefined;
    const workflowId = record.get('workflowId') as number | undefined;
    if (!userId || !workflowId) {
      return;
    }
    const workflowKey = await this.getWorkflowKeyById(workflowId, transaction);
    if (!workflowKey) {
      return;
    }
    const [row] = await this.collectCcTaskStats({
      userIds: [userId],
      workflowKeys: [workflowKey],
      transaction,
    });
    const stats = row ?? {
      userId,
      workflowKey,
      type: TASK_TYPE_CC,
      pending: 0,
      all: 0,
    };
    await (this.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer).updateTaskStatsByWorkflow(
      {
        userId,
        workflowKey,
        type: TASK_TYPE_CC,
        stats,
      },
      { transaction },
    );
  };

  async load() {
    initActions(this.app);

    this.app.acl.allow('workflowCcTasks', ['list', 'listMine', 'get', 'read', 'unread', 'readAll'], 'loggedIn');

    const workflowPlugin = this.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
    workflowPlugin.registerInstruction('cc', CCInstruction);
    workflowPlugin.registerTaskStatsProvider(TASK_TYPE_CC, {
      collectTaskStats: (options) => this.collectCcTaskStats(options),
    });

    this.app.db.on('workflowCcTasks.afterCreateWithAssociations', this.onRecordSave);
    this.app.db.on('workflowCcTasks.afterUpdate', this.onRecordSave);
  }
}

export default PluginWorkflowCCServer;
