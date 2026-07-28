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
import WorkflowPlugin, { EXECUTION_STATUS, TaskStatsRow } from '@nocobase/plugin-workflow';

import * as jobActions from './actions';

import ManualInstruction from './ManualInstruction';
import { TASK_TYPE_MANUAL, TASK_STATUS } from '../common/constants';

type GroupedTaskCount = {
  userId: number;
  workflowId: number;
  count: number | string;
};

export default class extends Plugin {
  private mergeTaskCounts(
    statsMap: Map<string, TaskStatsRow>,
    rows: GroupedTaskCount[],
    workflowKeyMap: Map<number, string>,
    field: 'pending' | 'all',
  ) {
    for (const row of rows) {
      const userId = row.userId;
      const workflowKey = workflowKeyMap.get(row.workflowId);
      if (!userId || !workflowKey) {
        continue;
      }
      const key = `${userId}\0${workflowKey}`;
      const stats = statsMap.get(key) ?? {
        userId,
        workflowKey,
        type: TASK_TYPE_MANUAL,
        pending: 0,
        all: 0,
      };
      stats[field] += Number(row.count) || 0;
      statsMap.set(key, stats);
    }
  }

  private async collectManualTaskStats(options: {
    userIds?: number[];
    workflowKeys?: string[];
    transaction?: Transaction;
  }): Promise<TaskStatsRow[]> {
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const WorkflowManualTaskModel = this.db.getModel('workflowManualTasks');
    const qualifiedColumn = (name: string) => {
      const fieldName = WorkflowManualTaskModel.getAttributes()[name].field ?? name;
      return this.db.sequelize.col(`${WorkflowManualTaskModel.name}.${fieldName}`);
    };
    const group = ['userId', 'workflowId'].map((name) => qualifiedColumn(name));
    const countColumn = qualifiedColumn('id');
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

    const allCounts = (await WorkflowManualTaskModel.findAll({
      attributes: ['userId', 'workflowId', [this.db.sequelize.fn('COUNT', countColumn), 'count']],
      where,
      group,
      raw: true,
      transaction: options.transaction,
    })) as unknown as GroupedTaskCount[];
    const pendingCounts = (await WorkflowManualTaskModel.findAll({
      attributes: ['userId', 'workflowId', [this.db.sequelize.fn('COUNT', countColumn), 'count']],
      where: {
        ...where,
        status: TASK_STATUS.PENDING,
      },
      include: [
        {
          association: 'execution',
          attributes: [],
          where: {
            status: EXECUTION_STATUS.STARTED,
          },
          required: true,
        },
      ],
      group,
      raw: true,
      transaction: options.transaction,
    })) as unknown as GroupedTaskCount[];
    const workflowIds = Array.from(new Set([...allCounts, ...pendingCounts].map((row) => row.workflowId)));
    const workflows = workflowIds.length
      ? await this.db.getRepository('workflows').find({
          filter: { id: workflowIds },
          fields: ['id', 'key'],
          transaction: options.transaction,
        })
      : [];
    const workflowKeyMap = new Map<number, string>(
      workflows.map((workflow) => [workflow.id as number, workflow.key as string]),
    );
    const statsMap = new Map<string, TaskStatsRow>();
    this.mergeTaskCounts(statsMap, allCounts, workflowKeyMap, 'all');
    this.mergeTaskCounts(statsMap, pendingCounts, workflowKeyMap, 'pending');

    return Array.from(statsMap.values());
  }

  private async updateManualWorkflowTaskStats(userId: number, workflowKey: string, transaction?: Transaction) {
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const [row] = await this.collectManualTaskStats({
      userIds: [userId],
      workflowKeys: [workflowKey],
      transaction,
    });
    const stats = row ?? {
      userId,
      workflowKey,
      type: TASK_TYPE_MANUAL,
      pending: 0,
      all: 0,
    };
    await workflowPlugin.updateTaskStatsByWorkflow(
      {
        userId,
        workflowKey,
        type: TASK_TYPE_MANUAL,
        stats,
      },
      { transaction },
    );
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

  private async updateManualTaskStats(userIds: number[], transaction?: Transaction) {
    if (!userIds.length) {
      return;
    }

    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    const rows = await this.collectManualTaskStats({ userIds: uniqueUserIds, transaction });

    for (const row of rows) {
      await workflowPlugin.updateTaskStatsByWorkflow(
        {
          userId: row.userId,
          workflowKey: row.workflowKey,
          type: TASK_TYPE_MANUAL,
          stats: row,
        },
        { transaction },
      );
    }
  }

  onTaskSave = async (task: Model, { transaction }) => {
    const userId = task.get('userId') as number | undefined;
    const workflowId = task.get('workflowId') as number | undefined;
    if (!userId || !workflowId) {
      return;
    }
    const workflowKey = await this.getWorkflowKeyById(workflowId, transaction);
    if (!workflowKey) {
      return;
    }
    await this.updateManualWorkflowTaskStats(userId, workflowKey, transaction);
  };

  onExecutionStatusChange = async (execution, { transaction }) => {
    if (!execution.status) {
      return;
    }
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    if (!execution.workflow) {
      execution.workflow =
        workflowPlugin.enabledCache.get(execution.workflowId) || (await execution.getWorkflow({ transaction }));
    }
    if (!execution.workflow) {
      return;
    }
    if (!execution.workflow.nodes) {
      execution.workflow.nodes = await execution.workflow.getNodes({ transaction });
    }
    const manualNodes = execution.workflow.nodes.filter((node) => node.type === 'manual');
    if (!manualNodes.length) {
      return;
    }
    const manualNodeIds = new Set(manualNodes.map((node) => node.id));

    const WorkflowManualTaskModel = this.db.getModel('workflowManualTasks');
    const manualTasks = await WorkflowManualTaskModel.findAll({
      attributes: ['id', 'userId'],
      where: {
        nodeId: Array.from(manualNodeIds),
        executionId: execution.id,
      },
      transaction,
    });

    const userIds = manualTasks.map((item) => item.userId).filter(Boolean);
    if (execution.status === EXECUTION_STATUS.ABORTED) {
      await WorkflowManualTaskModel.update(
        {
          status: TASK_STATUS.ABORTED,
        },
        {
          where: {
            id: manualTasks.map((item) => item.id),
            status: TASK_STATUS.PENDING,
          },
          transaction,
        },
      );
    }

    await this.updateManualTaskStats(userIds, transaction);
  };

  onWorkflowStatusChange = async (workflow, { transaction }) => {
    const WorkflowManualTaskModel = this.db.getModel('workflowManualTasks');
    const rows = await WorkflowManualTaskModel.findAll({
      attributes: ['userId'],
      where: {
        workflowId: workflow.id,
      },
      transaction,
    });
    await this.updateManualTaskStats(rows.map((row) => row.get('userId') as number).filter(Boolean), transaction);
  };

  async load() {
    this.app.resourceManager.define({
      name: 'workflowManualTasks',
      actions: jobActions,
    });

    this.app.acl.allow('workflowManualTasks', ['listMine', 'get', 'submit'], 'loggedIn');

    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflowPlugin.registerInstruction('manual', ManualInstruction);
    workflowPlugin.registerTaskStatsProvider(TASK_TYPE_MANUAL, {
      collectTaskStats: (options) => this.collectManualTaskStats(options),
    });

    this.db.on('workflowManualTasks.afterCreateWithAssociations', this.onTaskSave);
    this.db.on('workflowManualTasks.afterUpdate', this.onTaskSave);
    this.db.on('workflowManualTasks.afterDestroy', this.onTaskSave);
    this.db.on('executions.afterUpdate', this.onExecutionStatusChange);
    // NOTE: no need re-calculate tasks after workflow status changed
    // this.db.on('workflows.afterUpdate', this.onWorkflowStatusChange);
  }
}
