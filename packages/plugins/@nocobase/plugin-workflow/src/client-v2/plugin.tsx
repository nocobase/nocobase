/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { Registry } from '@nocobase/utils/client';
import { NAMESPACE } from './locale';
import {
  WORKFLOW_CANVAS_ROUTE_NAME,
  WORKFLOW_CANVAS_ROUTE_PATH,
  WORKFLOW_EXECUTION_ROUTE_NAME,
  WORKFLOW_EXECUTION_ROUTE_PATH,
  WORKFLOW_TASKS_MOBILE_ROUTE_NAME,
  WORKFLOW_TASKS_MOBILE_ROUTE_PATH,
  WORKFLOW_TASKS_ROUTE_NAME,
  WORKFLOW_TASKS_ROUTE_PATH,
} from './constants';
import type { TaskTypeOptions } from './taskCenter';
import type { Instruction } from './canvas/Instruction';
import type { Trigger } from './triggers';
import './models/triggerWorkflows';

// Core node instructions — one file per node under `nodes/`, mirroring v1's `client/nodes/` layout. Each
// default-exports its Instruction class.
import CalculationInstruction from './nodes/calculation';
import ConditionInstruction from './nodes/condition';
import MultiConditionsInstruction from './nodes/multi-conditions';
import EndInstruction from './nodes/end';
import OutputInstruction from './nodes/output';
import QueryInstruction from './nodes/query';
import CreateInstruction from './nodes/create';
import UpdateInstruction from './nodes/update';
import DestroyInstruction from './nodes/destroy';
import CollectionTrigger from './triggers/collection';
import ScheduleTrigger from './triggers/schedule';

export type InstructionGroup = { key: string; label: string };

const tpl = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

/** Core instruction groups, in v1 display order. */
const coreInstructionGroups: InstructionGroup[] = [
  { key: 'control', label: tpl('Control') },
  { key: 'calculation', label: tpl('Calculation') },
  { key: 'collection', label: tpl('Collection operations') },
  { key: 'manual', label: tpl('Manual') },
  { key: 'extended', label: tpl('Extended types') },
];

/**
 * A workflow **system variable** (the `$system` scope). Registered by the
 * workflow plugin itself — fixed, framework-independent values (current time,
 * instance id, snowflake id), not contributed by any other plugin. Mirrors v1's
 * `registerSystemVariable` (`client/index.tsx`).
 */
export type SystemVariableOption = {
  /** Registry key + the path segment under `$system` (e.g. `now`). */
  key: string;
  /** Display label. Accepts a plain string or a `{{t("…")}}` template. */
  label: string;
  /** Optional tooltip shown next to the label. */
  tooltip?: string;
};

export class PluginWorkflowClientV2 extends Plugin {
  triggers = new Registry<Trigger>();
  instructions = new Registry<Instruction>();
  instructionGroups = new Registry<InstructionGroup>();
  systemVariables = new Registry<SystemVariableOption>();
  taskTypes = new Registry<TaskTypeOptions>();

  /**
   * Register a `$system` scope variable. Mirrors v1's `registerSystemVariable`
   * but writes to *this* (v2) runtime's registry. The workflow plugin registers
   * the builtin ones (time / instance id / snowflake id) on load.
   */
  registerSystemVariable(option: SystemVariableOption) {
    this.systemVariables.register(option.key, option);
  }

  registerTaskType(key: string, option: Omit<TaskTypeOptions, 'key'> | TaskTypeOptions) {
    this.taskTypes.register(key, { ...option, key });
  }

  isWorkflowSync(workflow) {
    return this.triggers.get(workflow?.type)?.sync ?? workflow?.sync;
  }

  /**
   * Register a node type's v2 instruction. Mirrors v1's `registerInstruction`
   * signature (accepts a class or an instance) but writes to *this* (v2)
   * runtime's registry — see ADR-0003 / doc §9.1 (runtime separation). A type
   * registered here appears in the v2 add-node menu and renders on the v2 canvas.
   */
  registerInstruction(type: string, instruction: Instruction | { new (): Instruction }) {
    if (typeof instruction === 'function') {
      this.instructions.register(type, new instruction());
    } else {
      this.instructions.register(type, instruction);
    }
  }

  getInstruction(type?: string) {
    return type ? this.instructions.get(type) : undefined;
  }

  registerInstructionGroup(key: string, group: InstructionGroup) {
    this.instructionGroups.register(key, group);
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

  getTriggerOptions(type?: string) {
    return type ? this.triggers.get(type) : undefined;
  }

  async load() {
    this.registerModelLoaders();
    this.registerBuiltinTriggers();
    this.registerBuiltinInstructions();
    this.registerBuiltinSystemVariables();
    this.registerSettingsPage();
    this.registerCanvasRoute();
    this.registerExecutionRoute();
    this.registerTaskCenterRoutes();
    this.registerTaskCenterEntryActions();
  }

  // The three fixed `$system` variables (v1 `client/index.tsx`). Self-registered by the workflow plugin — no external
  // dependency, so available in v2 now.
  private registerBuiltinSystemVariables() {
    this.registerSystemVariable({ key: 'now', label: `{{t("System time", { ns: "${NAMESPACE}" })}}` });
    this.registerSystemVariable({
      key: 'instanceId',
      label: `{{t("Instance ID", { ns: "${NAMESPACE}" })}}`,
      tooltip: `{{t("The ID of current server instance", { ns: "${NAMESPACE}" })}}`,
    });
    this.registerSystemVariable({
      key: 'genSnowflakeId',
      label: `{{t("Generate snowflake ID", { ns: "${NAMESPACE}" })}}`,
      tooltip: `{{t("53 bit (JavaScript safe) unique ID generated by Snowflake algorithm. Will always generate new one each time use this variable.", { ns: "${NAMESPACE}" })}}`,
    });
  }

  private registerBuiltinInstructions() {
    coreInstructionGroups.forEach((group) => this.registerInstructionGroup(group.key, group));
    // Register each core node, in v1 order (mirrors v1's `client/index.tsx`).
    this.registerInstruction('calculation', CalculationInstruction);
    this.registerInstruction('condition', ConditionInstruction);
    this.registerInstruction('multi-conditions', MultiConditionsInstruction);
    this.registerInstruction('end', EndInstruction);
    this.registerInstruction('output', OutputInstruction);
    this.registerInstruction('query', QueryInstruction);
    this.registerInstruction('create', CreateInstruction);
    this.registerInstruction('update', UpdateInstruction);
    this.registerInstruction('destroy', DestroyInstruction);
  }

  private registerModelLoaders() {
    // Lazy loaders (not eager `registerModels`). `extends` declares the parent class so the engine can discover these
    // as sub-model candidates without loading their chunks first.
    this.flowEngine.registerModelLoaders({
      NodeDetailsModel: {
        extends: 'CollectionBlockModel',
        loader: () => import('./models/NodeDetailsModel'),
      },
      NodeDetailsGridModel: {
        extends: 'DetailsGridModel',
        loader: () => import('./models/NodeDetailsGridModel'),
      },
      NodeValueModel: {
        extends: 'BlockModel',
        loader: () => import('./models/NodeValueModel'),
      },
      TaskCardCommonItemModel: {
        extends: 'DetailsCustomItemModel',
        loader: () => import('./models/TaskCardCommonItemModel'),
      },
      WorkflowTasksTopbarActionModel: {
        extends: 'TopbarActionModel',
        loader: () => import('./models/WorkflowTasksTopbarActionModel'),
      },
      WorkflowTasksEntryActionModel: {
        extends: 'ActionModel',
        loader: () => import('./models/WorkflowTasksEntryActionModel'),
      },
      WorkflowTasksEmbeddedPageModel: {
        extends: 'ChildPageModel',
        loader: () => import('./models/WorkflowTasksEmbeddedPageModel'),
      },
    });
  }

  private registerBuiltinTriggers() {
    this.registerTrigger('collection', CollectionTrigger);
    this.registerTrigger('schedule', ScheduleTrigger);
  }

  private registerSettingsPage() {
    const t = (key: string) => this.app.i18n.t(key, { ns: NAMESPACE });
    this.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title: t('Workflow'),
      icon: 'PartitionOutlined',
      isPinned: true,
      sort: 300,
      aclSnippet: 'pm.workflow.workflows',
    });
    // `index` is the menu's default tab: the settings manager registers it at the menu root (`.../settings/workflow`)
    // with no extra path segment, matching v1's route instead of `.../settings/workflow/workflows`.
    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'index',
      title: t('Workflow'),
      aclSnippet: 'pm.workflow.workflows',
      sort: 1,
      componentLoader: () => import('./pages/WorkflowPane'),
    });
  }

  // The canvas page is registered directly under `admin` (not `admin.settings`), so it renders in the admin content
  // area without the settings left menu — mirroring v1's `router.add('admin.workflow.workflows.id', ...)`.
  private registerCanvasRoute() {
    this.app.router.add(WORKFLOW_CANVAS_ROUTE_NAME, {
      path: WORKFLOW_CANVAS_ROUTE_PATH,
      componentLoader: () => import('./pages/WorkflowCanvasPage'),
    });
  }

  // The execution detail page, a sibling of the canvas under the same `admin.workflow` namespace — mirrors v1's
  // `admin.workflow.executions.id`.
  private registerExecutionRoute() {
    this.app.router.add(WORKFLOW_EXECUTION_ROUTE_NAME, {
      path: WORKFLOW_EXECUTION_ROUTE_PATH,
      componentLoader: () => import('./pages/ExecutionViewPage'),
    });
  }

  private registerTaskCenterRoutes() {
    this.app.router.add(WORKFLOW_TASKS_ROUTE_NAME, {
      path: WORKFLOW_TASKS_ROUTE_PATH,
      componentLoader: () => import('./pages/WorkflowTasksPage'),
    });

    this.app.router.add(WORKFLOW_TASKS_MOBILE_ROUTE_NAME, {
      path: WORKFLOW_TASKS_MOBILE_ROUTE_PATH,
      componentLoader: () => import('./pages/WorkflowTasksPage'),
    });
  }

  private registerTaskCenterEntryActions() {
    if (!this.app.entryActionManager) {
      return;
    }
    const t = (key: string) => this.app.i18n.t(key, { ns: NAMESPACE });
    this.app.entryActionManager.register('workflow:tasks:action-panel', {
      scope: 'action-panel',
      sort: 300,
      provider: async () => [
        {
          key: 'workflow:tasks',
          label: t('Workflow todos'),
          createModelOptions: {
            use: 'WorkflowTasksEntryActionModel',
            props: {
              title: tpl('Workflow todos'),
              icon: 'CheckCircleOutlined',
            },
            stepParams: {
              popupSettings: {
                openView: {
                  mode: 'embed',
                  pageModelClass: 'WorkflowTasksEmbeddedPageModel',
                },
              },
            },
          },
        },
      ],
    });
  }
}

export default PluginWorkflowClientV2;
export type { TaskTypeOptions } from './taskCenter';
