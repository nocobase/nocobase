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
export * from '../shared/catalogAuthoring';

export { default as JsTemplateCatalogPage } from '../client-v2/pages/JsTemplateCatalogPage';
export { default as JsTemplateSourceProjectsPage } from '../client-v2/pages/JsTemplateSourceProjectsPage';
export { JS_TEMPLATE_SETTINGS_KEY } from '../constants';

import { JS_TEMPLATE_ACL_SNIPPET, JS_TEMPLATE_SETTINGS_KEY, NAMESPACE } from '../constants';
import {
  installJsTemplateRunJSIntegrations,
  registerJsTemplateRunJSFlowSettingsComponents,
} from '../client-v2/jsTemplateRunJSIntegration';
import JsTemplateCatalogPage from '../client-v2/pages/JsTemplateCatalogPage';
import JsTemplateSourceProjectsPage from '../client-v2/pages/JsTemplateSourceProjectsPage';
import { registerJsTemplateRuntimeAuthSession } from '../client-v2/resolvers/JsTemplateRuntimeCacheRegistry';

export interface JsTemplateClientOptions {
  name?: string;
  packageName?: string;
  [key: string]: unknown;
}

interface ClientV1SettingsOptions {
  icon?: string;
  title: string;
  Component?: React.ComponentType;
  aclSnippet: string;
  hidden?: boolean;
  sort?: number;
}

interface ClientV1SettingsManager {
  add: (name: string, options: ClientV1SettingsOptions) => void;
}

interface ClientV1I18n {
  t: (text: string, options?: { ns?: string }) => string;
}

interface ClientV1App {
  pluginSettingsManager?: ClientV1SettingsManager;
  i18n?: ClientV1I18n;
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

function translate(app: ClientV1App | undefined, text: string) {
  return app?.i18n?.t(text, { ns: NAMESPACE }) || text;
}

let activeJsTemplateClientV1Instance: PluginJsTemplateClient | null = null;

export class PluginJsTemplateClient {
  private readonly disposers: Array<() => void> = [];

  constructor(
    public readonly options: JsTemplateClientOptions = {},
    protected readonly app?: ClientV1App,
  ) {}

  async afterAdd() {}

  async beforeLoad() {
    activeJsTemplateClientV1Instance?.dispose();
    this.dispose();
  }

  dispose() {
    while (this.disposers.length) {
      this.disposers.pop()?.();
    }
    if (activeJsTemplateClientV1Instance === this) {
      activeJsTemplateClientV1Instance = null;
    }
  }

  async load() {
    const flowSettings = this.app?.flowEngine?.flowSettings;
    if (flowSettings?.registerComponents) {
      this.disposers.push(
        registerJsTemplateRunJSFlowSettingsComponents({
          components: flowSettings.components,
          registerComponents: flowSettings.registerComponents.bind(flowSettings),
        }),
      );
    }

    if (this.app?.apiClient) {
      this.disposers.push(registerJsTemplateRuntimeAuthSession(this.app.apiClient, this.app));
    }
    this.disposers.push(installJsTemplateRunJSIntegrations(this.app?.apiClient));

    const settingsOptions: ClientV1SettingsOptions = {
      icon: 'CodeOutlined',
      title: translate(this.app, 'JS Templates'),
      aclSnippet: JS_TEMPLATE_ACL_SNIPPET,
    };
    this.app?.pluginSettingsManager?.add(JS_TEMPLATE_SETTINGS_KEY, settingsOptions);
    this.app?.pluginSettingsManager?.add(`${JS_TEMPLATE_SETTINGS_KEY}.templates`, {
      title: translate(this.app, 'Templates'),
      Component: JsTemplateCatalogPage,
      aclSnippet: JS_TEMPLATE_ACL_SNIPPET,
      sort: 1,
    });
    this.app?.pluginSettingsManager?.add(`${JS_TEMPLATE_SETTINGS_KEY}.source-projects`, {
      title: translate(this.app, 'Source Projects'),
      Component: JsTemplateSourceProjectsPage,
      aclSnippet: JS_TEMPLATE_ACL_SNIPPET,
      sort: 2,
    });
    activeJsTemplateClientV1Instance = this;
  }
}

export default PluginJsTemplateClient;
