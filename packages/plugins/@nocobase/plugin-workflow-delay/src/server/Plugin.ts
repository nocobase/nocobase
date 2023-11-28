import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import DelayInstruction from './DelayInstruction';

export default class WorkflowParallelPlugin extends Plugin {
  workflow: WorkflowPlugin;

  async load() {
    const workflowPlugin = this.app.getPlugin(WorkflowPlugin) as WorkflowPlugin;
    this.workflow = workflowPlugin;
    workflowPlugin.instructions.register('delay', new DelayInstruction(workflowPlugin));
  }
}
