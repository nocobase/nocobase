/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { Plugin } from '@nocobase/client-v2';

import { LIGHT_EXTENSION_ACL_SNIPPET } from '../constants';
import {
  installJsTemplateRunJSIntegrations,
  registerJsTemplateRunJSFlowSettingsComponents,
} from './jsTemplateRunJSIntegration';
import {
  JS_TEMPLATE_LEGACY_SETTINGS_KEY,
  JS_TEMPLATE_SETTINGS_KEY,
  JS_TEMPLATE_V2_UI_CONTRACT,
} from './jsTemplateV2UIContract';
import { registerLightExtensionRuntimeAuthSession } from './resolvers/LightExtensionRuntimeCacheRegistry';

// Owns this module's active contributions during hot reload or instance handoff; it is not an Application singleton.
let activeJsTemplateClientV2Instance: PluginJsTemplateClientV2 | null = null;

const loadJsTemplateListPage = () => import('./pages/LightExtensionListPage');

export class PluginJsTemplateClientV2 extends Plugin<Record<string, never>, Application> {
  private readonly disposers: Array<() => void> = [];

  async beforeLoad() {
    activeJsTemplateClientV2Instance?.dispose();
    this.dispose();
  }

  async load() {
    this.disposers.push(registerLightExtensionRuntimeAuthSession(this.app.apiClient, this.app));

    this.disposers.push(registerJsTemplateRunJSFlowSettingsComponents(this.flowEngine.flowSettings));
    this.disposers.push(installJsTemplateRunJSIntegrations(this.app.apiClient));
    activeJsTemplateClientV2Instance = this;

    const title = this.t(JS_TEMPLATE_V2_UI_CONTRACT.productNameKey);

    this.pluginSettingsManager.addMenuItem({
      key: JS_TEMPLATE_SETTINGS_KEY,
      title,
      icon: 'CodeOutlined',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      showTabs: false,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: JS_TEMPLATE_SETTINGS_KEY,
      key: 'index',
      title,
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: loadJsTemplateListPage,
    });

    this.pluginSettingsManager.addMenuItem({
      key: JS_TEMPLATE_LEGACY_SETTINGS_KEY,
      title,
      icon: 'CodeOutlined',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      hidden: true,
      showTabs: false,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: JS_TEMPLATE_LEGACY_SETTINGS_KEY,
      key: 'index',
      title,
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: loadJsTemplateListPage,
      hidden: true,
    });
  }

  dispose() {
    while (this.disposers.length) {
      this.disposers.pop()?.();
    }
    if (activeJsTemplateClientV2Instance === this) {
      activeJsTemplateClientV2Instance = null;
    }
  }
}

export { PluginJsTemplateClientV2 as PluginLightExtensionClientV2 };

export default PluginJsTemplateClientV2;
