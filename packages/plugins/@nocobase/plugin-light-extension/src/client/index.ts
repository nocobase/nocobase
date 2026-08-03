/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type React from 'react';

export * from './vsc-file/public-api';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../constants';
import {
  installJsTemplateRunJSIntegrations,
  registerJsTemplateRunJSFlowSettingsComponents,
} from '../client-v2/jsTemplateRunJSIntegration';
import LightExtensionListPage from '../client-v2/pages/LightExtensionListPage';
import { registerLightExtensionRuntimeAuthSession } from '../client-v2/resolvers/LightExtensionRuntimeCacheRegistry';

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
  apiClient?: Parameters<typeof installJsTemplateRunJSIntegrations>[0];
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
    const flowSettings = this.app?.flowEngine?.flowSettings;
    if (flowSettings?.registerComponents) {
      this.disposers.push(registerJsTemplateRunJSFlowSettingsComponents(flowSettings));
    }

    if (this.app?.apiClient) {
      this.disposers.push(registerLightExtensionRuntimeAuthSession(this.app.apiClient, this.app));
    }
    this.disposers.push(installJsTemplateRunJSIntegrations(this.app?.apiClient));

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
