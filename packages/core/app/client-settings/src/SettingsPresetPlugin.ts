/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, type PluginClass } from '@nocobase/client-v2';
import { CollectionPluginV2 } from '../../../../presets/nocobase/src/client-v2/CollectionPluginV2';
import { SettingsApplication } from '../../../client-v2/src/settings-app/SettingsApplication';
import { SettingsBuildInPlugin } from '../../../client-v2/src/settings-app/SettingsBuildInPlugin';
import { resolveSettingsRuntimeScope } from './runtimeScope';

const CollectionPluginClass = CollectionPluginV2 as unknown as PluginClass;
const SettingsBuildInPluginClass = SettingsBuildInPlugin as unknown as PluginClass;

function offsetToTimeZone(offset: number) {
  const hours = Math.floor(Math.abs(offset));
  const minutes = Math.abs((offset % 1) * 60);
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const sign = offset >= 0 ? '+' : '-';
  return `${sign}${formattedHours}:${formattedMinutes}`;
}

function getCurrentTimezone() {
  return offsetToTimeZone(new Date().getTimezoneOffset() / -60);
}

export class SettingsPresetPlugin extends Plugin<object, SettingsApplication> {
  private getHostname() {
    if (process.env.API_BASE_URL) {
      try {
        return new URL(process.env.API_BASE_URL).hostname;
      } catch {
        // Fall back to the document hostname when API_BASE_URL is relative or invalid.
      }
    }
    return window.location.hostname;
  }

  async afterAdd() {
    const { basename } = resolveSettingsRuntimeScope(this.app.getPublicPath(), window.location.pathname);
    this.router.setType('browser');
    this.router.setBasename(basename);
    this.app.apiClient.axios.interceptors.request.use((config) => {
      config.headers['X-Hostname'] = this.getHostname();
      config.headers['X-Timezone'] = getCurrentTimezone();
      return config;
    });
    await this.app.pm.add(CollectionPluginClass, { name: 'builtin-collection-v2' });
    await this.app.pm.add(SettingsBuildInPluginClass, { name: 'builtin-settings-v2' });
  }
}
