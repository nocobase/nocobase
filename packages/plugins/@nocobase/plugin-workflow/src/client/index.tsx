/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';

import { Plugin, useCompile, WorkflowConfig } from '@nocobase/client';
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
import EndInstruction from './nodes/end';
import QueryInstruction from './nodes/query';
import CreateInstruction from './nodes/create';
import UpdateInstruction from './nodes/update';
import DestroyInstruction from './nodes/destroy';
import { getWorkflowDetailPath, getWorkflowExecutionsPath } from './utils';
import { lang, NAMESPACE } from './locale';
import { customizeSubmitToWorkflowActionSettings } from './settings/customizeSubmitToWorkflowActionSettings';
import { VariableOption } from './variable';

export default class PluginWorkflowClient extends Plugin {
  triggers = new Registry<Trigger>();
  instructions = new Registry<Instruction>();
  systemVariables = new Registry<VariableOption>();

  useTriggersOptions = () => {
    const compile = useCompile();
    return Array.from(this.triggers.getEntities()).map(([value, { title, ...options }]) => ({
      value,
      label: compile(title),
      color: 'gold',
      options,
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

  registerSystemVariable(option: VariableOption) {
    this.systemVariables.register(option.key, option);
  }

  async load() {
    this.app.router.add('admin.workflow.workflows.id', {
      path: getWorkflowDetailPath(':id'),
      element: <WorkflowPage />,
    });

    this.app.router.add('admin.workflow.executions.id', {
      path: getWorkflowExecutionsPath(':id'),
      element: <ExecutionPage />,
    });

    this.app.addComponents({
      WorkflowPage,
      ExecutionPage,
    });

    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'PartitionOutlined',
      title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
      Component: WorkflowPane,
      aclSnippet: 'pm.workflow.workflows',
    });

    this.app.schemaSettingsManager.add(customizeSubmitToWorkflowActionSettings);

    this.app.schemaSettingsManager.addItem('actionSettings:delete', 'workflowConfig', {
      Component: WorkflowConfig,
      useVisible() {
        const fieldSchema = useFieldSchema();
        return isValid(fieldSchema?.['x-action-settings']?.triggerWorkflows);
      },
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
    this.registerSystemVariable({
      key: 'dateRange',
      label: `{{t("Date range", { ns: "${NAMESPACE}" })}}`,
      value: 'dateRange',
      children: [
        {
          key: 'yesterday',
          value: 'yesterday',
          label: `{{t("Yesterday", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'today',
          value: 'today',
          label: `{{t("Today", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'tomorrow',
          value: 'tomorrow',
          label: `{{t("Tomorrow", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'lastWeek',
          value: 'lastWeek',
          label: `{{t("Last week", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'thisWeek',
          value: 'thisWeek',
          label: `{{t("This week", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'nextWeek',
          value: 'nextWeek',
          label: `{{t("Next week", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'lastMonth',
          value: 'lastMonth',
          label: `{{t("Last month", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'thisMonth',
          value: 'thisMonth',
          label: `{{t("This month", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'nextMonth',
          value: 'nextMonth',
          label: `{{t("Next month", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'lastQuarter',
          value: 'lastQuarter',
          label: `{{t("Last quarter", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'thisQuarter',
          value: 'thisQuarter',
          label: `{{t("This quarter", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'nextQuarter',
          value: 'nextQuarter',
          label: `{{t("Next quarter", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'lastYear',
          value: 'lastYear',
          label: `{{t("Last year", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'thisYear',
          value: 'thisYear',
          label: `{{t("This year", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'nextYear',
          value: 'nextYear',
          label: `{{t("Next year", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'last7Days',
          value: 'last7Days',
          label: `{{t("Last 7 days", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'next7Days',
          value: 'next7Days',
          label: `{{t("Next 7 days", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'last30Days',
          value: 'last30Days',
          label: `{{t("Last 30 days", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'next30Days',
          value: 'next30Days',
          label: `{{t("Next 30 days", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'last90Days',
          value: 'last90Days',
          label: `{{t("Last 90 days", { ns: "${NAMESPACE}" })}}`,
        },
        {
          key: 'next90Days',
          value: 'next90Days',
          label: `{{t("Next 90 days", { ns: "${NAMESPACE}" })}}`,
        },
      ],
    });
  }
}

export * from './Branch';
export * from './FlowContext';
export * from './constants';
export * from './nodes';
export { Trigger, useTrigger } from './triggers';
export * from './variable';
export * from './components';
export * from './utils';
export * from './hooks';
export { default as useStyles } from './style';
export * from './variable';
export * from './ExecutionContextProvider';
