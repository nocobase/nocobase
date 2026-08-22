/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient as APIClientSDK, hasHeaderValue } from '@nocobase/sdk';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { AxiosRequestConfig } from 'axios';
import React from 'react';

type ResponseMessage = string | { message?: unknown };

interface APIClientApplication {
  getName?: () => string | undefined;
  context?: {
    notification?: NotificationInstance;
  };
}

interface NotificationError {
  config?: AxiosRequestConfig & {
    skipNotify?: boolean | ((error: unknown) => boolean);
  };
}

const notificationCache = new Map<string, number>();

function getMessageText(item: ResponseMessage): string {
  if (typeof item === 'string') {
    return item;
  }
  return typeof item?.message === 'string' ? item.message : '';
}

function deduplicateMessages(messages: ResponseMessage[]): ResponseMessage[] {
  if (notificationCache.size > 10) {
    notificationCache.clear();
  }
  const now = Date.now();
  return messages.filter((item) => {
    const message = getMessageText(item);
    if (!message) {
      return false;
    }
    const lastTime = notificationCache.get(message);
    if (lastTime && now - lastTime < 500) {
      return false;
    }
    notificationCache.set(message, now);
    return true;
  });
}

function notify(type: 'success' | 'error', messages: ResponseMessage[], instance?: NotificationInstance) {
  if (!instance || messages.length === 0) {
    return;
  }
  const filteredMessages = deduplicateMessages(messages);
  if (filteredMessages.length === 0) {
    return;
  }
  instance[type]({
    message: filteredMessages.map((item, index) => {
      const message = getMessageText(item);
      return React.createElement('div', { key: `${index}_${message}` }, message);
    }),
  });
}

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

export class APIClient extends APIClientSDK {
  app?: APIClientApplication;

  get notification() {
    return this.app?.context?.notification;
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
      const headers = this.getHeaders();
      Object.keys(headers).forEach((key) => {
        if (!hasHeaderValue(config.headers, key)) {
          config.headers[key] = headers[key];
        }
      });
      return config;
    });
    super.interceptors();
    this.useNotificationMiddleware();
  }

  handleNotificationError(error: unknown) {
    const notificationError = error as NotificationError;
    const skipNotify = notificationError.config?.skipNotify;
    if (skipNotify && (skipNotify === true || (typeof skipNotify === 'function' && skipNotify(error)))) {
      throw error;
    }
    const messages = this.toErrMessages(error);
    if (Array.isArray(messages)) {
      notify('error', messages, this.notification);
    }
    throw error;
  }

  useNotificationMiddleware() {
    this.axios.interceptors.response.use((response) => {
      const messages = response.data?.messages;
      if (Array.isArray(messages)) {
        notify('success', messages, this.notification);
      }
      return response;
    }, this.handleNotificationError.bind(this));
  }
}
