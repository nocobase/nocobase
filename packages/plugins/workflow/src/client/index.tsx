export * from './Branch';
export * from './FlowContext';
export * from './nodes';
export { triggers } from './triggers';

import { Plugin } from '@nocobase/client';
import { WorkflowProvider } from './WorkflowProvider';

export class WorkflowPlugin extends Plugin {
  async load() {
    this.app.use(WorkflowProvider);
  }
}

export default WorkflowPlugin;
