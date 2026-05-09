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
import type { PropertyMeta } from '@nocobase/flow-engine';

type EnvironmentVariable = {
  name: string;
  value?: string;
  type?: 'default' | 'secret';
};

const ENV_VARS_LIST_URL = 'environmentVariables?paginate=false';

async function fetchEnvironmentVariables(apiClient: Application['apiClient']): Promise<EnvironmentVariable[]> {
  try {
    const response = await apiClient.request({
      url: ENV_VARS_LIST_URL,
      skipNotify: true,
    } as any);
    const list = (response as any)?.data?.data;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

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
    // only hit on first read, then cached by FlowContext.
    this.flowEngine.context.defineProperty('$env', {
      get: async () => {
        const list = await fetchEnvironmentVariables(this.app.apiClient);
        return Object.fromEntries(list.map((item) => [item.name, item.value]));
      },
      meta: {
        type: 'object',
        title: this.t('Variables and secrets') as unknown as string,
        properties: async (): Promise<Record<string, PropertyMeta>> => {
          const list = await fetchEnvironmentVariables(this.app.apiClient);
          const out: Record<string, PropertyMeta> = {};
          for (const item of list) {
            out[item.name] = {
              type: item.type === 'secret' ? 'string' : item.type || 'string',
              title: item.name,
            };
          }
          return out;
        },
      },
    });
  }
}

export default PluginEnvironmentVariablesClientV2;
