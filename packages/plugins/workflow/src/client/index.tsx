export * from './Branch';
export * from './FlowContext';
export * from './nodes';
export { triggers } from './triggers';

import { Plugin } from '@nocobase/client';
import React from 'react';
import { ExecutionPage } from './ExecutionPage';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowProvider } from './WorkflowProvider';

export class WorkflowPlugin extends Plugin {
  async load() {
    this.addRoutes();
    this.app.use(WorkflowProvider);
  }

  addComponents() {
    this.app.addComponents({
      WorkflowPage,
      ExecutionPage,
    });
  }

  addRoutes() {
    this.app.router.add('admin.settings.workflow.workflows.id', {
      path: '/admin/settings/workflow/workflows/:id',
      element: <WorkflowPage />,
    });
    this.app.router.add('admin.settings.workflow.executions.id', {
      path: '/admin/settings/workflow/executions/:id',
      element: <ExecutionPage />,
    });
  }
}

export default WorkflowPlugin;
