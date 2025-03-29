/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import { submit } from './actions';

import ManualInstruction from './ManualInstruction';
import { MANUAL_TASK_TYPE } from '../common/constants';

interface WorkflowManualTaskModel {
  id: number;
  userId: number;
  workflowId: number;
  executionId: number;
  status: number;
}

export default class extends Plugin {
  async load() {
    this.app.resourceManager.registerActionHandler('workflowManualTasks:submit', submit);

    this.app.acl.allow('workflowManualTasks', ['list', 'get', 'submit'], 'loggedIn');

    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflowPlugin.registerInstruction('manual', ManualInstruction);

    this.db.on('workflowManualTasks.afterSave', async (task: WorkflowManualTaskModel, options) => {
      await workflowPlugin.toggleTaskStatus(
        {
          type: MANUAL_TASK_TYPE,
          key: `${task.id}`,
          userId: task.userId,
          workflowId: task.workflowId,
        },
        Boolean(task.status),
        options,
      );
    });
  }
}
