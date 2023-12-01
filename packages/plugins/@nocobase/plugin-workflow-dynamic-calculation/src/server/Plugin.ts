import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import { ExpressionField } from './expression-field';
import { DynamicCalculation } from './DynamicCalculation';

export default class extends Plugin {
  workflow: WorkflowPlugin;

  async load() {
    this.db.registerFieldTypes({
      expression: ExpressionField,
    });

    const workflowPlugin = this.app.getPlugin('workflow') as WorkflowPlugin;
    this.workflow = workflowPlugin;
    workflowPlugin.instructions.register('dynamic-calculation', new DynamicCalculation(workflowPlugin));
  }
}
