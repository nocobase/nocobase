import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import ActionTrigger from './ActionTrigger';

export default class extends Plugin {
  async load() {
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflowPlugin.triggers.register('action', new ActionTrigger(workflowPlugin));
  }
}
