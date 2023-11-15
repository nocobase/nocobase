export * from './constants';
export * from './Branch';
export * from './FlowContext';
export * from './nodes';
export { triggers, useTrigger, getTriggersOptions } from './triggers';
export * from './variable';
export { default as useStyles } from './style';

import { Plugin } from '@nocobase/client';
import React from 'react';
import { ExecutionPage } from './ExecutionPage';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowPane, WorkflowProvider } from './WorkflowProvider';
import { DynamicExpression } from './components/DynamicExpression';
import { triggers, useTrigger, getTriggersOptions } from './triggers';
import { instructions } from './nodes';
import { WorkflowTodo } from './nodes/manual/WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './nodes/manual/WorkflowTodoBlockInitializer';
import { useTriggerWorkflowsActionProps } from './triggers/form';
import { NAMESPACE } from './locale';
import { getWorkflowDetailPath, getWorkflowExecutionsPath } from './constant';

export class WorkflowPlugin extends Plugin {
  triggers = triggers;
  getTriggersOptions = getTriggersOptions;
  instructions = instructions;

  async load() {
    this.addRoutes();
    this.addScopes();
    this.addComponents();
    this.app.addProvider(WorkflowProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'PartitionOutlined',
      title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
      Component: WorkflowPane,
      aclSnippet: 'pm.workflow.workflows',
    });
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
    this.app.router.add('admin.workflow.workflows.id', {
      path: getWorkflowDetailPath(':id'),
      element: <WorkflowPage />,
    });
    this.app.router.add('admin.workflow.executions.id', {
      path: getWorkflowExecutionsPath(':id'),
      element: <ExecutionPage />,
    });
  }
}

export default WorkflowPlugin;
