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

export default class extends Plugin {
  async load() {
    this.app.resourceManager.define({
      name: 'users_jobs',
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

    this.app.acl.allow('users_jobs', ['list', 'get', 'submit', 'countMine'], 'loggedIn');

    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflowPlugin.registerInstruction('manual', ManualInstruction);
  }
}
