export * from './Branch';
export * from './FlowContext';
export * from './constants';
export * from './nodes';
export { default as useStyles } from './style';
export { getTriggersOptions, triggers, useTrigger } from './triggers';
export * from './variable';
export { getCollectionFieldOptions, useWorkflowVariableOptions } from './variable';

import { Plugin } from '@nocobase/client';
import React from 'react';
import { ExecutionPage } from './ExecutionPage';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowPane, WorkflowProvider } from './WorkflowProvider';
import { DynamicExpression } from './components/DynamicExpression';
import { instructions } from './nodes';
import { addActionButton, addBlockButton } from './nodes/manual/SchemaConfig';
import { WorkflowTodo } from './nodes/manual/WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './nodes/manual/WorkflowTodoBlockInitializer';
import { addCustomFormField } from './nodes/manual/forms/custom';
import { getTriggersOptions, triggers } from './triggers';
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
    this.addSchemaInitializers();

    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'PartitionOutlined',
      title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
      Component: WorkflowPane,
      aclSnippet: 'pm.workflow.workflows',
    });
  }

  addSchemaInitializers() {
    this.app.schemaInitializerManager.add(addBlockButton);
    this.app.schemaInitializerManager.add(addActionButton);
    this.app.schemaInitializerManager.add(addCustomFormField);

    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers.add('media.workflowTodos', {
      title: `{{t("Workflow todos", { ns: "${NAMESPACE}" })}}`,
      Component: 'WorkflowTodoBlockInitializer',
      icon: 'CheckSquareOutlined',
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
