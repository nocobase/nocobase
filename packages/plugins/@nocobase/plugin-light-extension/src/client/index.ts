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
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  RunJSSourceResolverRegistry,
  registerBlockGridSelectSceneAddBlockProvider,
} from '@nocobase/client-v2';

import LightExtensionHomePage from '../client-shared/LightExtensionHomePage';
import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../constants';
import { createLightExtensionJSBlockAddItems } from '../client-v2/add-block/lightExtensionJsBlockItems';
import {
  JSBlockLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
} from '../client-v2/components/JSBlockLightExtensionSourceField';
import { RepoEntryPublicationSelector } from '../client-v2/components/RepoEntryPublicationSelector';
import { SettingsAutoForm, SettingsSingleField } from '../client-v2/components/SettingsAutoForm';
import { VersionPolicyField } from '../client-v2/components/VersionPolicyField';
import { createLightExtensionRunJSResolver } from '../client-v2/resolvers/LightExtensionRunJSResolver';

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
      registerComponents?: (components: Record<string, React.ElementType>) => void;
    };
  };
}

function translate(app: LegacyApp | undefined, text: string) {
  return app?.i18n?.t(text, { ns: NAMESPACE }) || text;
}

/**
 * Legacy admin-shell bridge.
 *
 * The canonical runtime is `src/client-v2`, but the current admin settings
 * shell still requests legacy client bundles. This registers the same minimal
 * settings page without importing the legacy runtime or adding SchemaComponent
 * behavior.
 */
export class PluginLightExtensionClient {
  private unregisterRunJSResolver?: () => void;
  private unregisterAddBlockProvider?: () => void;

  constructor(
    public readonly options: LightExtensionLegacyClientOptions = {},
    protected readonly app?: LegacyApp,
  ) {}

  async afterAdd() {}

  async beforeLoad() {
    this.unregisterRunJSResolver?.();
    this.unregisterRunJSResolver = undefined;
    this.unregisterAddBlockProvider?.();
    this.unregisterAddBlockProvider = undefined;
  }

  async load() {
    this.app?.flowEngine?.flowSettings?.registerComponents?.({
      [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSBlockLightExtensionSourceField,
      [JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      [JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSFieldLightExtensionSourceField,
      [JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      RepoEntryPublicationSelector,
      SettingsAutoForm,
      VersionPolicyField,
    });

    if (this.app?.apiClient) {
      this.unregisterRunJSResolver = RunJSSourceResolverRegistry.registerResolver(
        createLightExtensionRunJSResolver(this.app.apiClient),
      );
    }

    this.unregisterAddBlockProvider = registerBlockGridSelectSceneAddBlockProvider(
      'light-extension-js-blocks',
      createLightExtensionJSBlockAddItems,
    );

    this.app?.pluginSettingsManager?.add(LIGHT_EXTENSION_SETTINGS_KEY, {
      icon: 'CodeOutlined',
      title: translate(this.app, 'Light extensions'),
      Component: LightExtensionHomePage,
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
  }
}

export default PluginLightExtensionClient;
