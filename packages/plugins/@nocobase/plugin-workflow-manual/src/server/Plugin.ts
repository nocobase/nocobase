/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import actions from '@nocobase/actions';
import { HandlerType } from '@nocobase/resourcer';
import WorkflowPlugin, { JOB_STATUS } from '@nocobase/plugin-workflow';

import * as jobActions from './actions';

import ManualInstruction from './ManualInstruction';
import { MANUAL_TASK_TYPE } from '../common/constants';
import { Model } from '@nocobase/database';

class WorkflowManualTaskModel extends Model {
  declare id: number;
  declare userId: number;
  declare workflowId: number;
  declare executionId: number;
  declare status: number;
}

export default class extends Plugin {
  async load() {
    this.app.resourceManager.define({
      name: 'workflowManualTasks',
      actions: {
        list: {
          filter: {
            $or: [
              {
                'workflow.enabled': true,
              },
              {
                'workflow.enabled': false,
                status: {
                  $ne: JOB_STATUS.PENDING,
                },
              },
            ],
          },
          handler: actions.list as HandlerType,
        },
        ...jobActions,
      },
    });

    this.app.acl.allow('workflowManualTasks', ['list', 'get', 'submit'], 'loggedIn');

    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflowPlugin.registerInstruction('manual', ManualInstruction);

    this.db.on('workflowManualTasks.afterSave', async (task: WorkflowManualTaskModel, { transaction }) => {
      // const allCount = await (task.constructor as typeof WorkflowManualTaskModel).count({
      //   where: {
      //     userId: task.userId,
      //   },
      //   transaction,
      // });
      await workflowPlugin.toggleTaskStatus(
        {
          type: MANUAL_TASK_TYPE,
          key: `${task.id}`,
          userId: task.userId,
          workflowId: task.workflowId,
        },
        task.status === JOB_STATUS.PENDING,
        // allCount,
        { transaction },
      );
    });
  }
}
