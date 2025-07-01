/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PagePopups, Plugin, useCompile, lazy } from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';
import MobileManager from '@nocobase/plugin-mobile/client';

// import { ExecutionPage } from './ExecutionPage';
// import { WorkflowPage } from './WorkflowPage';
// import { WorkflowPane } from './WorkflowPane';
const { ExecutionPage } = lazy(() => import('./ExecutionPage'), 'ExecutionPage');
const { WorkflowPage } = lazy(() => import('./WorkflowPage'), 'WorkflowPage');
const { WorkflowPane } = lazy(() => import('./WorkflowPane'), 'WorkflowPane');

import { NAMESPACE } from './locale';
import { Instruction } from './nodes';
import CalculationInstruction from './nodes/calculation';
import ConditionInstruction from './nodes/condition';
import CreateInstruction from './nodes/create';
import DestroyInstruction from './nodes/destroy';
import EndInstruction from './nodes/end';
import QueryInstruction from './nodes/query';
import UpdateInstruction from './nodes/update';
import { BindWorkflowConfig } from './settings/BindWorkflowConfig';
import { Trigger } from './triggers';
import CollectionTrigger from './triggers/collection';
import ScheduleTrigger from './triggers/schedule';
import { getWorkflowDetailPath, getWorkflowExecutionsPath } from './utils';
import { VariableOption } from './variable';
import {
  MobileTabBarWorkflowTasksItem,
  TasksProvider,
  tasksSchemaInitializerItem,
  TaskTypeOptions,
  WorkflowTasks,
  WorkflowTasksMobile,
} from './WorkflowTasks';
import { WorkflowCollectionsProvider } from './WorkflowCollectionsProvider';
import { observer } from '@formily/react';

const workflowConfigSettings = {
  Component: BindWorkflowConfig,
};

type InstructionGroup = {
  key?: string;
  label: string;
};

export default class PluginWorkflowClient extends Plugin {
  triggers = new Registry<Trigger>();
  instructions = new Registry<Instruction>();
  instructionGroups = new Registry<InstructionGroup>();
  systemVariables = new Registry<VariableOption>();

  taskTypes = new Registry<TaskTypeOptions>();

  useTriggersOptions = () => {
    const compile = useCompile();
    return Array.from(this.triggers.getEntities())
      .map(([value, { title, ...options }]) => ({
        value,
        label: compile(title),
        color: 'gold',
        options,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  useInstructionGroupOptions = () => {
    const compile = useCompile();
    return Array.from(this.instructionGroups.getEntities()).map(([key, { label }]) => ({
      key,
      label: compile(label),
    }));
  };

  isWorkflowSync(workflow) {
    return this.triggers.get(workflow.type)?.sync ?? workflow.sync;
  }

  registerTrigger(type: string, trigger: Trigger | { new (): Trigger }) {
    if (typeof trigger === 'function') {
      this.triggers.register(type, new trigger());
    } else if (trigger) {
      this.triggers.register(type, trigger);
    } else {
      throw new TypeError('invalid trigger type to register');
    }
  }

  registerInstruction(type: string, instruction: Instruction | { new (): Instruction }) {
    if (typeof instruction === 'function') {
      this.instructions.register(type, new instruction());
    } else if (instruction instanceof Instruction) {
      this.instructions.register(type, instruction);
    } else {
      throw new TypeError('invalid instruction type to register');
    }
  }

  registerInstructionGroup(key: string, group: InstructionGroup) {
    this.instructionGroups.register(key, group);
  }

  registerSystemVariable(option: VariableOption) {
    this.systemVariables.register(option.key, option);
  }

  registerTaskType(key: string, option: TaskTypeOptions) {
    this.taskTypes.register(key, option);
  }

  async load() {
    this.app.addProvider(WorkflowCollectionsProvider);
    this.app.addProvider(TasksProvider);

    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'PartitionOutlined',
      title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
      Component: WorkflowPane,
      aclSnippet: 'pm.workflow.workflows',
    });

    this.app.schemaSettingsManager.addItem('actionSettings:submit', 'workflowConfig', workflowConfigSettings);
    this.app.schemaSettingsManager.addItem('actionSettings:createSubmit', 'workflowConfig', workflowConfigSettings);
    this.app.schemaSettingsManager.addItem('actionSettings:updateSubmit', 'workflowConfig', workflowConfigSettings);
    this.app.schemaSettingsManager.addItem('actionSettings:saveRecord', 'workflowConfig', workflowConfigSettings);
    this.app.schemaSettingsManager.addItem('actionSettings:updateRecord', 'workflowConfig', workflowConfigSettings);
    this.app.schemaSettingsManager.addItem('actionSettings:delete', 'workflowConfig', workflowConfigSettings);
    this.app.schemaSettingsManager.addItem('actionSettings:bulkEditSubmit', 'workflowConfig', workflowConfigSettings);

    this.router.add('admin.workflow.workflows.id', {
      path: getWorkflowDetailPath(':id'),
      Component: WorkflowPage,
    });

    this.router.add('admin.workflow.executions.id', {
      path: getWorkflowExecutionsPath(':id'),
      Component: ExecutionPage,
    });

    this.router.add('admin.workflow.tasks', {
      path: '/admin/workflow/tasks/:taskType/:status/:popupId?',
      Component: WorkflowTasks,
    });

    const mobileManager = this.pm.get(MobileManager);
    this.app.schemaInitializerManager.addItem('mobile:tab-bar', 'workflow-tasks', tasksSchemaInitializerItem);
    this.app.addComponents({ MobileTabBarWorkflowTasksItem });
    if (mobileManager.mobileRouter) {
      mobileManager.mobileRouter.add('mobile.page.workflow', {
        path: '/page/workflow',
      });
      mobileManager.mobileRouter.add('mobile.page.workflow.tasks', {
        path: '/page/workflow/tasks/:taskType/:status/:popupId?',
        Component: observer(WorkflowTasksMobile, { displayName: 'WorkflowTasksMobile' }),
      });
    }

    this.registerInstructionGroup('control', { key: 'control', label: `{{t("Control", { ns: "${NAMESPACE}" })}}` });
    this.registerInstructionGroup('calculation', {
      key: 'calculation',
      label: `{{t("Calculation", { ns: "${NAMESPACE}" })}}`,
    });
    this.registerInstructionGroup('collection', {
      key: 'collection',
      label: `{{t("Collection operations", { ns: "${NAMESPACE}" })}}`,
    });
    this.registerInstructionGroup('manual', { key: 'manual', label: `{{t("Manual", { ns: "${NAMESPACE}" })}}` });
    this.registerInstructionGroup('extended', {
      key: 'extended',
      label: `{{t("Extended types", { ns: "${NAMESPACE}" })}}`,
    });

    this.registerTrigger('collection', CollectionTrigger);
    this.registerTrigger('schedule', ScheduleTrigger);

    this.registerInstruction('calculation', CalculationInstruction);
    this.registerInstruction('condition', ConditionInstruction);
    this.registerInstruction('end', EndInstruction);

    this.registerInstruction('query', QueryInstruction);
    this.registerInstruction('create', CreateInstruction);
    this.registerInstruction('update', UpdateInstruction);
    this.registerInstruction('destroy', DestroyInstruction);

    this.registerSystemVariable({
      key: 'now',
      label: `{{t("System time", { ns: "${NAMESPACE}" })}}`,
      value: 'now',
    });
  }
}

export * from './Branch';
export * from './components';
export * from './constants';
export * from './ExecutionContextProvider';
export * from './FlowContext';
export * from './hooks';
export * from './nodes';
export * from './settings/BindWorkflowConfig';
export { default as useStyles } from './style';
export { Trigger, useTrigger } from './triggers';
export * from './utils';
export * from './variable';
export { TASK_STATUS, usePopupRecordContext } from './WorkflowTasks';
