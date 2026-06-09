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
import type { ComponentType } from 'react';
import { NAMESPACE } from './locale';
import {
  WORKFLOW_CANVAS_ROUTE_NAME,
  WORKFLOW_CANVAS_ROUTE_PATH,
  WORKFLOW_EXECUTION_ROUTE_NAME,
  WORKFLOW_EXECUTION_ROUTE_PATH,
} from './constants';
import type { Instruction } from './canvas/Instruction';

// Core node instructions — one file per node under `nodes/`, mirroring v1's
// `client/nodes/` layout. Each default-exports its Instruction class.
import CalculationInstruction from './nodes/calculation';
import ConditionInstruction from './nodes/condition';
import MultiConditionsInstruction from './nodes/multi-conditions';
import EndInstruction from './nodes/end';
import OutputInstruction from './nodes/output';
import QueryInstruction from './nodes/query';
import CreateInstruction from './nodes/create';
import UpdateInstruction from './nodes/update';
import DestroyInstruction from './nodes/destroy';

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

type LoaderOf<P = Record<string, never>> = () => Promise<{ default: ComponentType<P> }>;

/**
 * V2 trigger-type registration. Mirrors `plugin-auth`'s `AuthOptions` /
 * `registerType` extension point. Each trigger contributes its create-time
 * configuration form as an async `import()` loader (the v1 `presetFieldset`
 * equivalent) so downstream trigger plugins ship their config form as a
 * separate chunk and only load it when that trigger type is actually chosen.
 *
 * The create config form renders below the common workflow fields inside the
 * "Add new" drawer; it reads/writes the parent antd `<Form>` via `Form.Item`
 * with `name={['config', ...]}` — i.e. its values land under `values.config.*`,
 * matching the v1 schema (`config: { properties: trigger.presetFieldset }`).
 */
export type WorkflowTriggerOptions = {
  /** Trigger type display name. Accepts a plain string or a `{{t("…")}}` template. */
  title: string;
  /**
   * Trigger type description, shown under the title in the "Trigger type"
   * dropdown. Accepts a plain string or a `{{t("…")}}` template.
   */
  description?: string;
  /**
   * Fixed execute mode for this trigger type. `true` = synchronous only,
   * `false` = asynchronous only, `undefined` = the user may choose.
   */
  sync?: boolean;
  /** Create-time configuration form loader (v1 `presetFieldset`). */
  createConfigFormLoader?: LoaderOf;
};

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
  triggers = new Registry<WorkflowTriggerOptions>();
  instructions = new Registry<Instruction>();
  instructionGroups = new Registry<InstructionGroup>();
  systemVariables = new Registry<SystemVariableOption>();

  /**
   * Register a `$system` scope variable. Mirrors v1's `registerSystemVariable`
   * but writes to *this* (v2) runtime's registry. The workflow plugin registers
   * the builtin ones (time / instance id / snowflake id) on load.
   */
  registerSystemVariable(option: SystemVariableOption) {
    this.systemVariables.register(option.key, option);
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

  registerTrigger(type: string, options: WorkflowTriggerOptions) {
    // Downstream plugins still call `pm.get('workflow').registerTrigger(type, TriggerClass)`
    // with the v1-style Trigger class (a no-op before this v2 plugin existed).
    // The v2 registry only holds plain option objects describing the create
    // form — ignore class/instance registrations rather than storing a garbage
    // entry with no `title`.
    if (!options || typeof options !== 'object' || typeof options.title !== 'string') {
      return;
    }
    this.triggers.register(type, options);
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
  }

  // The three fixed `$system` variables (v1 `client/index.tsx`). Self-registered
  // by the workflow plugin — no external dependency, so available in v2 now.
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
    // Lazy loaders (not eager `registerModels`). `extends` declares the parent
    // class so the engine can discover these as sub-model candidates without
    // loading their chunks first.
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
    });
  }

  private registerBuiltinTriggers() {
    this.registerTrigger('collection', {
      title: `{{t("Collection event", { ns: "${NAMESPACE}" })}}`,
      description: `{{t('Triggered when data changes in the collection, such as after adding, updating, or deleting a record. Unlike "Post-action event", Collection event listens for data changes rather than HTTP requests. Unless you understand the exact meaning, it is recommended to use "Post-action event".', { ns: "${NAMESPACE}" })}}`,
      createConfigFormLoader: () => import('./triggers/collection/CreateConfigForm'),
    });
    this.registerTrigger('schedule', {
      title: `{{t("Schedule event", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Triggered according to preset time conditions. Suitable for one-time or periodic tasks, such as sending notifications and cleaning data on a schedule.", { ns: "${NAMESPACE}" })}}`,
      sync: false,
      createConfigFormLoader: () => import('./triggers/schedule/CreateConfigForm'),
    });
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
    // `index` is the menu's default tab: the settings manager registers it at
    // the menu root (`.../settings/workflow`) with no extra path segment,
    // matching v1's route instead of `.../settings/workflow/workflows`.
    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'index',
      title: t('Workflow'),
      aclSnippet: 'pm.workflow.workflows',
      sort: 1,
      componentLoader: () => import('./pages/WorkflowPane'),
    });
  }

  // The canvas page is registered directly under `admin` (not `admin.settings`),
  // so it renders in the admin content area without the settings left menu —
  // mirroring v1's `router.add('admin.workflow.workflows.id', ...)`.
  private registerCanvasRoute() {
    this.app.router.add(WORKFLOW_CANVAS_ROUTE_NAME, {
      path: WORKFLOW_CANVAS_ROUTE_PATH,
      componentLoader: () => import('./pages/WorkflowCanvasPage'),
    });
  }

  // The execution detail page, a sibling of the canvas under the same
  // `admin.workflow` namespace — mirrors v1's `admin.workflow.executions.id`.
  private registerExecutionRoute() {
    this.app.router.add(WORKFLOW_EXECUTION_ROUTE_NAME, {
      path: WORKFLOW_EXECUTION_ROUTE_PATH,
      componentLoader: () => import('./pages/ExecutionViewPage'),
    });
  }
}

export default PluginWorkflowClientV2;
