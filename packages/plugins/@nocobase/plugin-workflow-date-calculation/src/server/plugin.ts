import WorkflowPlugin from '@nocobase/plugin-workflow';
import { Plugin } from '@nocobase/server';

import DateCalculationInstruction from './DateCalculationInstruction';

export class PluginWorkflowDateCalculationServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const workflowPlugin = this.app.pm.get<WorkflowPlugin>(WorkflowPlugin);
    workflowPlugin.registerInstruction('dateCalculation', DateCalculationInstruction);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginWorkflowDateCalculationServer;
