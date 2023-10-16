export * from './constants';
export * from './Branch';
export * from './FlowContext';
export * from './nodes';
export { triggers, useTrigger, getTriggersOptions } from './triggers';
export { useWorkflowVariableOptions } from './variable';

import { Plugin } from '@nocobase/client';
import React from 'react';
import { ExecutionPage } from './ExecutionPage';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowProvider } from './WorkflowProvider';
import { DynamicExpression } from './components/DynamicExpression';
import { WorkflowTodo } from './nodes/manual/WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './nodes/manual/WorkflowTodoBlockInitializer';
import { useTriggerWorkflowsActionProps } from './triggers/form';

export class WorkflowPlugin extends Plugin {
  async load() {
    this.addRoutes();
    this.addScopes();
    this.addComponents();
    this.app.addProvider(WorkflowProvider);
  }

  addScopes() {
    this.app.addScopes({
      useTriggerWorkflowsActionProps,
    });
  }

  addComponents() {
    this.app.addComponents({
      WorkflowPage,
      ExecutionPage,
      WorkflowTodo,
      WorkflowTodoBlockInitializer,
      DynamicExpression,
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
