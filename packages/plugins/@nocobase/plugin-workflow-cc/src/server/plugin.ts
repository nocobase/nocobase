/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Model } from '@nocobase/database';

import PluginWorkflowServer from '@nocobase/plugin-workflow';
import CCInstruction from './CCInstruction';
import { TASK_STATUS, TASK_TYPE_CC } from '../common/constants';
import { initActions } from './actions';

export class PluginWorkflowCCServer extends Plugin {
  onRecordSave = async (record: Model, { transaction }) => {
    // TODO: no applicant should be deprecated
    if (!record.userId) {
      return;
    }
    const CCModel = record.constructor as unknown as Model;
    const pending = await CCModel.count({
      where: {
        userId: record.userId,
        status: TASK_STATUS.UNREAD,
      },
      transaction,
    });
    const all = await CCModel.count({
      where: {
        userId: record.userId,
      },
      transaction,
    });
    await (this.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer).updateTasksStats(
      record.userId,
      TASK_TYPE_CC,
      { pending, all },
      { transaction },
    );
  };

  async load() {
    initActions(this.app);

    this.app.acl.allow('workflowCcTasks', ['list', 'listMine', 'get', 'read', 'unread', 'readAll'], 'loggedIn');

    const workflowPlugin = this.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
    workflowPlugin.registerInstruction('cc', CCInstruction);

    this.app.db.on('workflowCcTasks.afterSave', this.onRecordSave);
  }
}

export default PluginWorkflowCCServer;
