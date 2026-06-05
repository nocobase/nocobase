import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/plugin-workflow/client';

import DateCalculationInstruction from './DateCalculationInstruction';

export class PluginWorkflowDateCalculationClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  async load() {
    console.log(this.app);
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerInstruction('dateCalculation', DateCalculationInstruction);
  }
}

export default PluginWorkflowDateCalculationClient;
