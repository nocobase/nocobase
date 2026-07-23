/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import WorkflowPlugin from '@nocobase/plugin-workflow';
import { Migration } from '@nocobase/server';

import { TASK_TYPE_MANUAL } from '../../common/constants';

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const workflowPlugin = this.pm.get(WorkflowPlugin) as WorkflowPlugin;
    await workflowPlugin.repairTaskStats({ types: [TASK_TYPE_MANUAL] });
  }
}
