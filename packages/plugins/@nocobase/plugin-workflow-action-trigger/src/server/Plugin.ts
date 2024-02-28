import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import FormTrigger from './FormTrigger';

export default class extends Plugin {
  async load() {
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);
    workflowPlugin.triggers.register('form', new FormTrigger(workflowPlugin));
  }
}
