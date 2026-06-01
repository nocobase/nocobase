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
   * Fixed execute mode for this trigger type. `true` = synchronous only,
   * `false` = asynchronous only, `undefined` = the user may choose.
   */
  sync?: boolean;
  /** Create-time configuration form loader (v1 `presetFieldset`). */
  createConfigFormLoader?: LoaderOf;
};

export class PluginWorkflowClientV2 extends Plugin {
  triggers = new Registry<WorkflowTriggerOptions>();

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
    this.registerSettingsPage();
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
      createConfigFormLoader: () => import('./triggers/collection/CreateConfigForm'),
    });
    this.registerTrigger('schedule', {
      title: `{{t("Schedule event", { ns: "${NAMESPACE}" })}}`,
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
    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'workflows',
      title: t('Workflow'),
      aclSnippet: 'pm.workflow.workflows',
      sort: 1,
      componentLoader: () => import('./pages/WorkflowPane'),
    });
  }
}

export default PluginWorkflowClientV2;
