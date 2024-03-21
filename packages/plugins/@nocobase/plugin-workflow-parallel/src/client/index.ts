import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import ParallelInstruction from './ParallelInstruction';

export default class extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin);
    workflow.registerInstruction('parallel', ParallelInstruction);
  }
}
