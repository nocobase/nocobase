import WorkflowPlugin from '@nocobase/plugin-workflow';
import { Plugin } from '@nocobase/server';

import AggregateInstruction from './AggregateInstruction';

export default class extends Plugin {
  async load() {
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);
    workflowPlugin.registerInstruction('aggregate', AggregateInstruction);
  }
}
