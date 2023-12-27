import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import { ExpressionField } from './expression-field';
import { DynamicCalculation } from './DynamicCalculation';

export default class extends Plugin {
  async load() {
    this.db.registerFieldTypes({
      expression: ExpressionField,
    });

    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);
    workflowPlugin.registerInstruction('dynamic-calculation', DynamicCalculation);
  }
}
