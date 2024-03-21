import { Plugin } from '@nocobase/server';
import { default as WorkflowPlugin } from '@nocobase/plugin-workflow';

import LoopInstruction from './LoopInstruction';

export default class extends Plugin {
  async load() {
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);
    workflowPlugin.registerInstruction('loop', LoopInstruction);
  }
}
