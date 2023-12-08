import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import DelayInstruction from './DelayInstruction';

export default class extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    const delayInstruction = new DelayInstruction();
    workflow.instructions.register(delayInstruction.type, delayInstruction);
  }
}
