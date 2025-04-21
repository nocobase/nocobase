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

import { Plugin } from '@nocobase/server';
import PluginWorkflowServer from '@nocobase/plugin-workflow';

import ResponseMessageInstruction from './ResponseMessageInstruction';

export class PluginWorkflowResponseMessageServer extends Plugin {
  async load() {
    const workflowPlugin = this.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
    workflowPlugin.registerInstruction('response-message', ResponseMessageInstruction);
  }
}

export default PluginWorkflowResponseMessageServer;
