export * from './Branch';
export * from './FlowContext';
export * from './constants';
export * from './nodes';
export { Trigger, useTrigger } from './triggers';
export * from './variable';
export * from './components';
export * from './utils';
export * from './hooks/useGetAriaLabelOfAddButton';
export { default as useStyles } from './style';
export * from './variable';
export { getCollectionFieldOptions, useWorkflowVariableOptions } from './variable';

import React from 'react';

import { Plugin } from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';

import { ExecutionPage } from './ExecutionPage';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowPane } from './WorkflowPane';
import { Trigger } from './triggers';
import CollectionTrigger from './triggers/collection';
import ScheduleTrigger from './triggers/schedule';
import { Instruction } from './nodes';
import CalculationInstruction from './nodes/calculation';
import ConditionInstruction from './nodes/condition';
import QueryInstruction from './nodes/query';
import CreateInstruction from './nodes/create';
import UpdateInstruction from './nodes/update';
import DestroyInstruction from './nodes/destroy';
import { useTriggerWorkflowsActionProps } from './hooks/useTriggerWorkflowActionProps';
import { getWorkflowDetailPath, getWorkflowExecutionsPath } from './constant';
import { NAMESPACE } from './locale';

export default class extends Plugin {
  triggers = new Registry<Trigger>();
  instructions = new Registry<Instruction>();
  getTriggersOptions = () => {
    return Array.from(this.triggers.getEntities()).map(([value, { title, ...options }]) => ({
      value,
      label: title,
      color: 'gold',
      options,
    }));
  };

  async load() {
    this.addRoutes();
    this.addScopes();
    this.addComponents();

    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'PartitionOutlined',
      title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
      Component: WorkflowPane,
      aclSnippet: 'pm.workflow.workflows',
    });

    this.triggers.register('collection', new CollectionTrigger());
    this.triggers.register('schedule', new ScheduleTrigger());

    this.instructions.register('calculation', new CalculationInstruction());
    this.instructions.register('condition', new ConditionInstruction());
    this.instructions.register('query', new QueryInstruction());
    this.instructions.register('create', new CreateInstruction());
    this.instructions.register('update', new UpdateInstruction());
    this.instructions.register('destroy', new DestroyInstruction());
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
