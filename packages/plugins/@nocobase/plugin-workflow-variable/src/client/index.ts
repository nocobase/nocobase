/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import VariableInstruction from './Instruction';

export class PluginWorkflowCustomVariableClient extends Plugin {
  constructor(options, app) {
    super(options, app);
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    const workflowPlugin = this.app.pm.get('workflow') as WorkflowPlugin;
    workflowPlugin.registerInstruction('variable', VariableInstruction);

    // this.app.addScopes({})
    // this.app.addProvider(ApprovalProvider);
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginWorkflowCustomVariableClient;
