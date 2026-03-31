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

import CustomActionTrigger from './CustomActionTrigger';

export class PluginWorkflowCustomActionTriggerServer extends Plugin {
  async load() {
    const workflowPlugin = this.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
    workflowPlugin.registerTrigger('custom-action', CustomActionTrigger);
  }
}

export default PluginWorkflowCustomActionTriggerServer;
