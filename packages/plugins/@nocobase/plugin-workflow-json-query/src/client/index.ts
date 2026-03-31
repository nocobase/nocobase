/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

import JSONQeuryInstruction from './instruction';

export class PluginWorkflowJSONQueryClient extends Plugin {
  constructor(options, app) {
    super(options, app);
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    const workflowPlugin = this.app.pm.get('workflow') as WorkflowPlugin;
    const instruction = new JSONQeuryInstruction();
    workflowPlugin.instructions.register(instruction.type, instruction);

    // this.app.addScopes({})
    // this.app.addProvider(ApprovalProvider);
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginWorkflowJSONQueryClient;
