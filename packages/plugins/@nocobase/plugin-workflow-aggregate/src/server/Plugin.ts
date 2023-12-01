import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import AggregateInstruction from './AggregateInstruction';

export default class extends Plugin {
  workflow: WorkflowPlugin;

  async load() {
    const workflowPlugin = this.app.getPlugin('workflow') as WorkflowPlugin;
    this.workflow = workflowPlugin;
    workflowPlugin.instructions.register('aggregate', new AggregateInstruction(workflowPlugin));
  }
}
