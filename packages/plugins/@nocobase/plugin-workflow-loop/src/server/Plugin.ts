import { Plugin } from '@nocobase/server';
import { default as WorkflowPlugin } from '@nocobase/plugin-workflow';

import LoopInstruction from './LoopInstruction';

export default class extends Plugin {
  workflow: WorkflowPlugin;

  async load() {
    const workflowPlugin = this.app.getPlugin('workflow') as WorkflowPlugin;
    this.workflow = workflowPlugin;
    workflowPlugin.instructions.register('loop', new LoopInstruction(workflowPlugin));
  }
}
