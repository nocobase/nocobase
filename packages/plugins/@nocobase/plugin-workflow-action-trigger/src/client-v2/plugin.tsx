/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import WorkflowPlugin from '@nocobase/plugin-workflow/client-v2';

import ActionTrigger from './ActionTrigger';

export default class PluginWorkflowActionTriggerClientV2 extends Plugin<unknown, Application> {
  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerTrigger('action', ActionTrigger);
  }
}
