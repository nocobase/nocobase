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

import ScriptInstruction from './ScriptInstruction';
import { registerWorkflowJavaScriptRunJSSourceAdapter } from './runjs-sources';

export class PluginWorkflowScriptServer extends Plugin {
  private unregisterRunJSSourceAdapter?: () => void;

  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflowPlugin.registerInstruction('script', ScriptInstruction);
    this.unregisterRunJSSourceAdapter?.();
    this.unregisterRunJSSourceAdapter = registerWorkflowJavaScriptRunJSSourceAdapter(this);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {
    this.unregisterRunJSSourceAdapter?.();
    this.unregisterRunJSSourceAdapter = undefined;
  }

  async remove() {
    this.unregisterRunJSSourceAdapter?.();
    this.unregisterRunJSSourceAdapter = undefined;
  }
}

export default PluginWorkflowScriptServer;
