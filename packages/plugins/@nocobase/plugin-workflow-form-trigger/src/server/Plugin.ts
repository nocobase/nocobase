import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import FormTrigger from './FormTrigger';

export default class extends Plugin {
  workflow: WorkflowPlugin;

  async load() {
    const workflowPlugin = this.app.getPlugin('workflow') as WorkflowPlugin;
    this.workflow = workflowPlugin;
    workflowPlugin.triggers.register('form', new FormTrigger(workflowPlugin));
  }
}
