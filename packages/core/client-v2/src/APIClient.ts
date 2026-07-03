/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient as APIClientSDK, type APIClientOptions, hasHeaderValue } from '@nocobase/sdk';

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

function hasRequestHeader(headers: unknown, name: string) {
  if (typeof headers === 'object' && headers && 'has' in headers) {
    const has = (headers as { has?: (headerName: string) => boolean }).has;
    if (typeof has === 'function' && has.call(headers, name)) {
      return true;
    }
  }
  return hasHeaderValue(headers, name);
}

export class APIClient extends APIClientSDK {
  appName?: string;

  constructor(options?: APIClientOptions) {
    super(options);
    if (options && typeof options !== 'function') {
      this.appName = options.appName;
    }
  }

  getHostname() {
    if (process.env.API_BASE_URL) {
      try {
        return new URL(process.env.API_BASE_URL).hostname;
      } catch {
        // fall through to window.location.hostname
      }
    }
    return window?.location?.hostname;
  }

  getHeaders() {
    const headers = super.getHeaders();
    if (this.appName) {
      headers['X-App'] = this.appName;
    }
    headers['X-Timezone'] = getCurrentTimezone();
    headers['X-Hostname'] = this.getHostname();
    return headers;
  }

  interceptors() {
    this.axios.interceptors.request.use((config) => {
      if (!hasRequestHeader(config.headers, 'X-With-ACL-Meta')) {
        config.headers['X-With-ACL-Meta'] = true;
      }
      const headers = this.getHeaders();
      Object.keys(headers).forEach((key) => {
        if (!hasHeaderValue(config.headers, key)) {
          config.headers[key] = headers[key];
        }
      });
      return config;
    });
    super.interceptors();
  }
}
