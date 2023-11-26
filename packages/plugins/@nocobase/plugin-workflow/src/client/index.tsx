export * from './constants';
export * from './Branch';
export * from './FlowContext';
export * from './nodes';
export { triggers, useTrigger, getTriggersOptions } from './triggers';
export * from './variable';
export * from './components';
export * from './utils';
export { default as useStyles } from './style';

import React from 'react';

import { Plugin } from '@nocobase/client';

import { ExecutionPage } from './ExecutionPage';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowPane } from './WorkflowPane';
import { triggers, getTriggersOptions } from './triggers';
import { instructions } from './nodes';
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
