/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, NocoBaseBuildInPluginV2, Plugin } from '@nocobase/client-v2';
import { CollectionPluginV2 } from './CollectionPluginV2';

function offsetToTimeZone(offset) {
  const hours = Math.floor(Math.abs(offset));
  const minutes = Math.abs((offset % 1) * 60);

  const formattedHours = (hours < 10 ? '0' : '') + hours;
  const formattedMinutes = (minutes < 10 ? '0' : '') + minutes;

  const sign = offset >= 0 ? '+' : '-';
  return sign + formattedHours + ':' + formattedMinutes;
}

const getCurrentTimezone = () => {
  const timezoneOffset = new Date().getTimezoneOffset() / -60;
  return offsetToTimeZone(timezoneOffset);
};

function getBasename(app: Application) {
  const publicPath = app.getPublicPath();
  const pattern = `^${publicPath}apps/([^/]*)/`;
  const match = location.pathname.match(new RegExp(pattern));
  return match?.[0];
}

function getBasenameOfNewMultiApp(app: Application) {
  const publicPath = app.getPublicPath();
  const pattern = `^${publicPath}_app/([^/]*)/`;
  const match = location.pathname.match(new RegExp(pattern));
  return match?.[0];
}

export class NocoBaseClientPresetPluginV2 extends Plugin<any, Application> {
  getHostname() {
    // 优先使用环境变量中的 API_BASE_URL
    if (process.env.API_BASE_URL) {
      try {
        const url = new URL(process.env.API_BASE_URL);
        return url.hostname;
      } catch (error) {
        // URL 解析失败时回退到 window.location.hostname
      }
    }
    // 回退到当前页面的 hostname
    return window?.location?.hostname;
  }

  async afterAdd() {
    this.router.setType('browser');
    this.router.setBasename(getBasename(this.app) || getBasenameOfNewMultiApp(this.app) || this.app.getPublicPath());
    this.app.apiClient.axios.interceptors.request.use((config) => {
      config.headers['X-Hostname'] = this.getHostname();
      config.headers['X-Timezone'] = getCurrentTimezone();
      return config;
    });
    await this.app.pm.add(CollectionPluginV2, { name: 'builtin-collection-v2' });
    await this.app.pm.add(NocoBaseBuildInPluginV2);
  }
}

export default NocoBaseClientPresetPluginV2;
