/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { runJSStudioToolbarRegistry } from './vsc-file/public-api';
import { installRunJSStudioClientV2 } from './vsc-file/plugin';
import {
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  Plugin,
  RunJSSourceResolverRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSEditorRegistry,
} from '@nocobase/client-v2';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY } from '../constants';
import {
  JSActionLightExtensionSourceField,
  JSBlockLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
  JSPageLightExtensionSourceField,
  RunJSLightExtensionSourceField,
} from './components/JSBlockLightExtensionSourceField';
import { createRunJSLightExtensionEditorProvider } from './components/RunJSLightExtensionEditorProvider';
import { createMoveSourceToLightExtensionContribution } from './components/MoveSourceToLightExtension';
import { SettingsSingleField } from './components/SettingsAutoForm';
import { registerLightExtensionModelMenus } from './modelMenu/registerLightExtensionModelMenus';
import { createLightExtensionRunJSResolver } from './resolvers/LightExtensionRunJSResolver';
import { registerLightExtensionRuntimeAuthSession } from './resolvers/LightExtensionRuntimeCacheRegistry';
import { createInlineLightExtensionSettingsDescriptorProvider } from './resolvers/InlineLightExtensionSettingsDescriptorProvider';

let activeLightExtensionClientV2Instance: PluginLightExtensionClientV2 | null = null;

export class PluginLightExtensionClientV2 extends Plugin<Record<string, never>, Application> {
  private readonly disposers: Array<() => void> = [];

  async beforeLoad() {
    activeLightExtensionClientV2Instance?.dispose();
    this.dispose();
  }

  async load() {
    this.disposers.push(installRunJSStudioClientV2());
    this.disposers.push(registerLightExtensionRuntimeAuthSession(this.app.apiClient, this.app));

    const components = {
      [JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSActionLightExtensionSourceField,
      [JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSBlockLightExtensionSourceField,
      [JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      [JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSFieldLightExtensionSourceField,
      [JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      [JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSItemLightExtensionSourceField,
      [JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      [JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSPageLightExtensionSourceField,
      [JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      RunJSLightExtensionSourceField,
    };
    const flowSettings = this.flowEngine.flowSettings;
    const previousComponents = new Map(
      Object.keys(components).map((name) => [
        name,
        {
          exists: Object.prototype.hasOwnProperty.call(flowSettings.components, name),
          value: flowSettings.components[name],
        },
      ]),
    );
    flowSettings.registerComponents(components, { warnOnOverwrite: false });
    this.disposers.push(() => {
      for (const [name, component] of Object.entries(components)) {
        if (flowSettings.components[name] !== component) {
          continue;
        }
        const previous = previousComponents.get(name);
        if (previous?.exists) {
          flowSettings.components[name] = previous.value;
        } else {
          delete flowSettings.components[name];
        }
      }
    });
    this.disposers.push(
      RunJSSourceResolverRegistry.registerResolver(createLightExtensionRunJSResolver(this.app.apiClient)),
    );
    this.disposers.push(
      RunJSSettingsDescriptorProviderRegistry.registerProvider(
        createInlineLightExtensionSettingsDescriptorProvider(this.app.apiClient),
      ),
    );
    this.disposers.push(RunJSEditorRegistry.registerProvider(createRunJSLightExtensionEditorProvider()));
    this.disposers.push(
      runJSStudioToolbarRegistry.register(createMoveSourceToLightExtensionContribution(this.app.apiClient)),
    );
    this.disposers.push(registerLightExtensionModelMenus(this.app.apiClient));
    activeLightExtensionClientV2Instance = this;

    const title = this.t('Light extensions');

    this.pluginSettingsManager.addMenuItem({
      key: LIGHT_EXTENSION_SETTINGS_KEY,
      title,
      icon: 'CodeOutlined',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      showTabs: false,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'index',
      title,
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/LightExtensionListPage'),
    });
  }

  dispose() {
    while (this.disposers.length) {
      this.disposers.pop()?.();
    }
    if (activeLightExtensionClientV2Instance === this) {
      activeLightExtensionClientV2Instance = null;
    }
  }
}

export default PluginLightExtensionClientV2;
