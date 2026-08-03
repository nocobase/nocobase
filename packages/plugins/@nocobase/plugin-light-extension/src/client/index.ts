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

export {
  default as JsTemplateListPage,
  default as LightExtensionListPage,
} from '../client-v2/pages/LightExtensionListPage';
export {
  JS_TEMPLATE_LEGACY_SETTINGS_KEY,
  JS_TEMPLATE_SETTINGS_KEY,
  JS_TEMPLATE_V2_UI_CONTRACT,
} from '../client-v2/jsTemplateV2UIContract';

import { NAMESPACE } from '../constants';
import {
  installJsTemplateRunJSIntegrations,
  registerJsTemplateRunJSFlowSettingsComponents,
} from '../client-v2/jsTemplateRunJSIntegration';
import JsTemplateListPage from '../client-v2/pages/LightExtensionListPage';
import {
  JS_TEMPLATE_LEGACY_SETTINGS_KEY,
  JS_TEMPLATE_SETTINGS_KEY,
  JS_TEMPLATE_V2_UI_CONTRACT,
} from '../client-v2/jsTemplateV2UIContract';
import { registerLightExtensionRuntimeAuthSession } from '../client-v2/resolvers/LightExtensionRuntimeCacheRegistry';

export interface JsTemplateLegacyClientOptions {
  name?: string;
  packageName?: string;
  [key: string]: unknown;
}

export type LightExtensionLegacyClientOptions = JsTemplateLegacyClientOptions;

interface LegacySettingsOptions {
  icon: string;
  title: string;
  Component: React.ComponentType;
  aclSnippet: string;
  hidden?: boolean;
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

let activeJsTemplateLegacyInstance: PluginJsTemplateClient | null = null;

/**
 * Legacy admin-shell bridge.
 *
 * The canonical runtime is `src/client-v2`, but the current admin settings
 * shell still requests legacy client bundles. This registers the same minimal
 * settings page without adding SchemaComponent behavior.
 */
export class PluginJsTemplateClient {
  private readonly disposers: Array<() => void> = [];

  constructor(
    public readonly options: JsTemplateLegacyClientOptions = {},
    protected readonly app?: LegacyApp,
  ) {}

  async afterAdd() {}

  async beforeLoad() {
    activeJsTemplateLegacyInstance?.dispose();
    this.dispose();
  }

  dispose() {
    while (this.disposers.length) {
      this.disposers.pop()?.();
    }
    if (activeJsTemplateLegacyInstance === this) {
      activeJsTemplateLegacyInstance = null;
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

    const settingsOptions: LegacySettingsOptions = {
      icon: 'CodeOutlined',
      title: translate(this.app, JS_TEMPLATE_V2_UI_CONTRACT.productNameKey),
      Component: JsTemplateListPage,
      aclSnippet: JS_TEMPLATE_V2_UI_CONTRACT.settings.legacyAclSnippet,
    };
    this.app?.pluginSettingsManager?.add(JS_TEMPLATE_SETTINGS_KEY, settingsOptions);
    this.app?.pluginSettingsManager?.add(JS_TEMPLATE_LEGACY_SETTINGS_KEY, {
      ...settingsOptions,
      hidden: true,
    });
    activeJsTemplateLegacyInstance = this;
  }
}

export { PluginJsTemplateClient as PluginLightExtensionClient };

export default PluginJsTemplateClient;
