/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, NocoBaseBuildInPlugin, Plugin } from '@nocobase/client';

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

export class NocoBaseClientPresetPlugin extends Plugin {
  async afterAdd() {
    this.router.setType('browser');
    this.router.setBasename(getBasename(this.app) || getBasenameOfNewMultiApp(this.app) || this.app.getPublicPath());
    this.app.apiClient.axios.interceptors.request.use((config) => {
      config.headers['X-Hostname'] = this.app.apiClient.getHostname();
      config.headers['X-Timezone'] = getCurrentTimezone();
      return config;
    });
    await this.app.pm.add(NocoBaseBuildInPlugin);
  }
}
