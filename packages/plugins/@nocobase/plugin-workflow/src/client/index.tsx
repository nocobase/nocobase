export * from './Branch';
export * from './FlowContext';
export * from './constants';
export * from './nodes';
export { default as useStyles } from './style';
export { getTriggersOptions, triggers, useTrigger } from './triggers';
export { getCollectionFieldOptions, useWorkflowVariableOptions } from './variable';

import { Plugin } from '@nocobase/client';
import React from 'react';
import { ExecutionPage } from './ExecutionPage';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowProvider } from './WorkflowProvider';
import { DynamicExpression } from './components/DynamicExpression';
import { NAMESPACE } from './locale';
import { instructions } from './nodes';
import { addActionButton, addBlockButton } from './nodes/manual/SchemaConfig';
import { WorkflowTodo } from './nodes/manual/WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './nodes/manual/WorkflowTodoBlockInitializer';
import { addCustomFormField } from './nodes/manual/forms/custom';
import { getTriggersOptions, triggers } from './triggers';
import { useTriggerWorkflowsActionProps } from './triggers/form';

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
