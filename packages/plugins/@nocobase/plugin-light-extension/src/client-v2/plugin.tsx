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

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY } from '../constants';
import {
  installJsTemplateRunJSIntegrations,
  registerJsTemplateRunJSFlowSettingsComponents,
} from './jsTemplateRunJSIntegration';
import { registerLightExtensionRuntimeAuthSession } from './resolvers/LightExtensionRuntimeCacheRegistry';

// Owns this module's active contributions during hot reload or instance handoff; it is not an Application singleton.
let activeLightExtensionClientV2Instance: PluginLightExtensionClientV2 | null = null;

export class PluginLightExtensionClientV2 extends Plugin<Record<string, never>, Application> {
  private readonly disposers: Array<() => void> = [];

  async beforeLoad() {
    activeLightExtensionClientV2Instance?.dispose();
    this.dispose();
  }

  async load() {
    this.disposers.push(registerLightExtensionRuntimeAuthSession(this.app.apiClient, this.app));

    this.disposers.push(registerJsTemplateRunJSFlowSettingsComponents(this.flowEngine.flowSettings));
    this.disposers.push(installJsTemplateRunJSIntegrations(this.app.apiClient));
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
