import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import { ExpressionField } from './expression-field';
import { DynamicCalculation } from './DynamicCalculation';

export default class WorkflowDynamicCalculationPlugin extends Plugin {
  workflow: WorkflowPlugin;

  beforeLoad() {
    this.app.on('afterLoadPlugin', (plugin) => {
      if (!(plugin instanceof WorkflowPlugin)) {
        return;
      }
      this.workflow = plugin;
      plugin.instructions.register('dynamic-calculation', new DynamicCalculation(plugin));
    });
  }

  async load() {
    this.db.registerFieldTypes({
      expression: ExpressionField,
    });
  }
}
