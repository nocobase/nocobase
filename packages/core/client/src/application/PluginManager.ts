/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  PluginManager as BasePluginManager,
  type PluginClass as BasePluginClass,
  type PluginData,
  type PluginType as BasePluginType,
} from '@nocobase/client-v2';
import type { Application } from './Application';
import { getPlugins } from './utils/remotePlugins';

export type { PluginData, PluginOptions } from '@nocobase/client-v2';
export type PluginClass<Opts = any> = BasePluginClass<Opts, Application>;
export type PluginType<Opts = any> = BasePluginType<Opts, Application>;

export class PluginManager extends BasePluginManager<Application> {
  private static readonly REMOTE_PLUGIN_RETRY_LIMIT = 100;
  private static readonly REMOTE_PLUGIN_RETRY_DELAY = 200;

  protected getRemotePluginsRequestUrl() {
    return 'pm:listEnabled';
  }

  protected async initRemotePlugins() {
    let res;
    for (let attempt = 0; attempt < PluginManager.REMOTE_PLUGIN_RETRY_LIMIT; attempt++) {
      try {
        res = await this.app.apiClient.request({ url: this.getRemotePluginsRequestUrl() });
        break;
      } catch (error) {
        const isMaintaining = !!error?.response?.data?.error?.maintaining;
        const isLastAttempt = attempt === PluginManager.REMOTE_PLUGIN_RETRY_LIMIT - 1;
        if (!isMaintaining || isLastAttempt) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, PluginManager.REMOTE_PLUGIN_RETRY_DELAY));
      }
    }

    const pluginList: PluginData[] = res?.data?.data || [];
    const plugins = await getPlugins({
      requirejs: this.app.requirejs,
      pluginData: pluginList,
      devDynamicImport: this.app.devDynamicImport,
    });
    for await (const [name, pluginClass] of plugins) {
      const info = pluginList.find((item) => item.name === name);
      await this.add(pluginClass as any, info);
    }
  }
}
