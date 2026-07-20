/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type React from 'react';
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
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
} from '@nocobase/client-v2';
import { runJSStudioToolbarRegistry } from '../client-v2/vsc-file/public-api';
import { installLegacyRunJSStudioClient } from './vsc-file/plugin';

export * from './vsc-file/public-api';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../constants';
import {
  JSActionLightExtensionSourceField,
  JSBlockLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../client-v2/components/JSBlockLightExtensionSourceField';
import { SettingsSingleField } from '../client-v2/components/SettingsAutoForm';
import { createRunJSLightExtensionEditorProvider } from '../client-v2/components/RunJSLightExtensionEditorProvider';
import { createMoveSourceToLightExtensionContribution } from '../client-v2/components/MoveSourceToLightExtension';
import { registerLightExtensionModelMenus } from '../client-v2/modelMenu/registerLightExtensionModelMenus';
import LightExtensionListPage from '../client-v2/pages/LightExtensionListPage';
import { createLightExtensionRunJSResolver } from '../client-v2/resolvers/LightExtensionRunJSResolver';
import { createInlineLightExtensionSettingsDescriptorProvider } from '../client-v2/resolvers/InlineLightExtensionSettingsDescriptorProvider';

interface LightExtensionLegacyClientOptions {
  name?: string;
  packageName?: string;
  [key: string]: unknown;
}

interface LegacySettingsOptions {
  icon: string;
  title: string;
  Component: React.ComponentType;
  aclSnippet: string;
}

interface LegacySettingsManager {
  add: (name: string, options: LegacySettingsOptions) => void;
}

interface LegacyI18n {
  t: (text: string, options?: { ns?: string }) => string;
}

interface LegacyApp {
  pluginSettingsManager?: LegacySettingsManager;
  i18n?: LegacyI18n;
  apiClient?: Parameters<typeof createLightExtensionRunJSResolver>[0];
  flowEngine?: {
    flowSettings?: {
      components?: Record<string, React.ElementType>;
      registerComponents?: (
        components: Record<string, React.ElementType>,
        options?: { warnOnOverwrite?: boolean },
      ) => void;
    };
  };
}

function translate(app: LegacyApp | undefined, text: string) {
  return app?.i18n?.t(text, { ns: NAMESPACE }) || text;
}

let activeLightExtensionLegacyInstance: PluginLightExtensionClient | null = null;

/**
 * Legacy admin-shell bridge.
 *
 * The canonical runtime is `src/client-v2`, but the current admin settings
 * shell still requests legacy client bundles. This registers the same minimal
 * settings page without adding SchemaComponent behavior.
 */
export class PluginLightExtensionClient {
  private readonly disposers: Array<() => void> = [];

  constructor(
    public readonly options: LightExtensionLegacyClientOptions = {},
    protected readonly app?: LegacyApp,
  ) {}

  async afterAdd() {}

  async beforeLoad() {
    activeLightExtensionLegacyInstance?.dispose();
    this.dispose();
  }

  dispose() {
    while (this.disposers.length) {
      this.disposers.pop()?.();
    }
    if (activeLightExtensionLegacyInstance === this) {
      activeLightExtensionLegacyInstance = null;
    }
  }

  async load() {
    this.disposers.push(installLegacyRunJSStudioClient());

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
    };
    const flowSettings = this.app?.flowEngine?.flowSettings;
    if (flowSettings?.registerComponents) {
      const registeredComponents = flowSettings.components;
      const previousComponents = registeredComponents
        ? new Map(
            Object.keys(components).map((name) => [
              name,
              {
                exists: Object.prototype.hasOwnProperty.call(registeredComponents, name),
                value: registeredComponents[name],
              },
            ]),
          )
        : null;
      flowSettings.registerComponents(components, { warnOnOverwrite: false });
      if (registeredComponents && previousComponents) {
        this.disposers.push(() => {
          for (const [name, component] of Object.entries(components)) {
            if (registeredComponents[name] !== component) {
              continue;
            }
            const previous = previousComponents.get(name);
            if (previous?.exists) {
              registeredComponents[name] = previous.value;
            } else {
              delete registeredComponents[name];
            }
          }
        });
      }
    }

    if (this.app?.apiClient) {
      this.disposers.push(registerLightExtensionModelMenus(this.app.apiClient));
      this.disposers.push(
        RunJSSourceResolverRegistry.registerResolver(createLightExtensionRunJSResolver(this.app.apiClient)),
      );
      this.disposers.push(
        RunJSSettingsDescriptorProviderRegistry.registerProvider(
          createInlineLightExtensionSettingsDescriptorProvider(this.app.apiClient),
        ),
      );
      this.disposers.push(
        runJSStudioToolbarRegistry.register(createMoveSourceToLightExtensionContribution(this.app.apiClient)),
      );
    }
    this.disposers.push(RunJSEditorRegistry.registerProvider(createRunJSLightExtensionEditorProvider()));

    this.app?.pluginSettingsManager?.add(LIGHT_EXTENSION_SETTINGS_KEY, {
      icon: 'CodeOutlined',
      title: translate(this.app, 'Light extensions'),
      Component: LightExtensionListPage,
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    activeLightExtensionLegacyInstance = this;
  }
}

export default PluginLightExtensionClient;
