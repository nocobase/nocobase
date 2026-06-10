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
import { registerEnvProperty } from './registerEnvProperty';

export class PluginEnvironmentVariablesClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const title = this.t('Variables and secrets') as unknown as string;

    this.pluginSettingsManager.addMenuItem({
      key: 'environment',
      title,
      icon: 'TableOutlined',
      aclSnippet: 'pm.environment-variables',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'environment',
      key: 'index',
      title,
      componentLoader: () => import('./pages/EnvironmentPage'),
    });

    // Expose `$env` to all v2 plugins via FlowContext, replacing v1's
    // `addGlobalVar('$env', ...)` + Provider chain. Lazy-loaded — the API is
    // only hit on first read, then cached by FlowContext. Shared with the v1
    // runtime via `registerEnvProperty` (see `./registerEnvProperty`).
    registerEnvProperty(this.flowEngine.context, this.app.apiClient, (key) => this.t(key));
  }
}

export default PluginEnvironmentVariablesClientV2;
