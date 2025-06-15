/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient as APIClientSDK } from '@nocobase/sdk';
import { Result } from 'ahooks/es/useRequest/src/types';
import { notification } from 'antd';
import React from 'react';
import { Application } from '../application';

function notify(type, messages, instance) {
  if (!messages?.length) {
    return;
  }
  instance[type]({
    message: messages.map?.((item: any, index) => {
      return React.createElement(
        'div',
        { key: `${index}_${item.message}` },
        typeof item === 'string' ? item : item.message,
      );
    }),
  });
}

const handleErrorMessage = (error, notification) => {
  const reader = new FileReader();
  reader.readAsText(error?.response?.data, 'utf-8');
  reader.onload = function () {
    const messages = JSON.parse(reader.result as string).errors;
    notify('error', messages, notification);
  };
};

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

const errorCache = new Map();
export class APIClient extends APIClientSDK {
  services: Record<string, Result<any, any>> = {};
  silence = false;
  app: Application;
  /** 该值会在 AntdAppProvider 中被重新赋值 */
  notification: any = notification;

  cloneInstance() {
    const api = new APIClient(this.options);
    api.options = this.options;
    api.services = this.services;
    api.storage = this.storage;
    api.app = this.app;
    api.auth = this.auth;
    api.storagePrefix = this.storagePrefix;
    api.notification = this.notification;
    const handlers = [];
    for (const handler of this.axios.interceptors.response['handlers']) {
      if (handler?.rejected?.['_name'] === 'handleNotificationError') {
        handlers.push({
          ...handler,
          rejected: api.handleNotificationError.bind(api),
        });
      } else {
        handlers.push(handler);
      }
    }
    api.axios.interceptors.response['handlers'] = handlers;
    return api;
  }

  getHeaders() {
    const headers = super.getHeaders();
    const appName = this.app?.getName();
    if (appName) {
      headers['X-App'] = appName;
    }
    headers['X-Timezone'] = getCurrentTimezone();
    headers['X-Hostname'] = window?.location?.hostname;
    return headers;
  }

  service(uid: string) {
    return this.services[uid];
  }

  interceptors() {
    this.axios.interceptors.request.use((config) => {
      config.headers['X-With-ACL-Meta'] = true;
      const headers = this.getHeaders();
      Object.keys(headers).forEach((key) => {
        config.headers[key] = config.headers[key] || headers[key];
      });
      return config;
    });
    super.interceptors();
    this.useNotificationMiddleware();
    this.axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        const errs = this.toErrMessages(error);
        // Hard code here temporarily
        // TODO(yangqia): improve error code and message
        if (errs.find((error: { code?: string }) => error.code === 'ROLE_NOT_FOUND_ERR')) {
          this.auth.setRole(null);
          window.location.reload();
        }
        if (errs.find((error: { code?: string }) => error.code === 'TOKEN_INVALID' || error.code === 'USER_LOCKED')) {
          this.auth.setToken(null);
        }
        if (errs.find((error: { code?: string }) => error.code === 'ROLE_NOT_FOUND_FOR_USER')) {
          this.auth.setRole(null);
          window.location.reload();
        }
        throw error;
      },
    );
  }

  toErrMessages(error) {
    if (typeof error?.response?.data === 'string') {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = error?.response?.data;
      let message = tempElement.textContent || tempElement.innerText;
      if (message.includes('Error occurred while trying')) {
        message = 'The application may be starting up. Please try again later.';
        return [{ code: 'APP_WARNING', message }];
      }
      if (message.includes('502 Bad Gateway')) {
        message = 'The application may be starting up. Please try again later.';
        return [{ code: 'APP_WARNING', message }];
      }
      return [{ message }];
    }
    if (error?.response?.data?.error) {
      return [error?.response?.data?.error];
    }
    return (
      error?.response?.data?.errors ||
      error?.response?.data?.messages ||
      error?.response?.error || [{ message: error.message || 'Server error' }]
    );
  }

  async handleNotificationError(error) {
    if (this.silence) {
      // console.error(error);
      // return;
      throw error;
    }
    const skipNotify: boolean | ((error: any) => boolean) = error.config?.skipNotify;
    if (skipNotify && ((typeof skipNotify === 'function' && skipNotify(error)) || skipNotify === true)) {
      throw error;
    }
    const redirectTo = error?.response?.data?.redirectTo;
    if (redirectTo) {
      return (window.location.href = redirectTo);
    }
    if (error?.response?.data?.type === 'application/json') {
      handleErrorMessage(error, this.notification);
    } else {
      if (errorCache.size > 10) {
        errorCache.clear();
      }
      const maintaining = !!error?.response?.data?.error?.maintaining;
      if (this.app.maintaining !== maintaining) {
        this.app.maintaining = maintaining;
      }
      if (this.app.maintaining) {
        this.app.error = error?.response?.data?.error;
        throw error;
      } else if (this.app.error) {
        this.app.error = null;
      }
      let errs = this.toErrMessages(error);
      errs = errs.filter((error) => {
        const lastTime = errorCache.get(error.message);
        if (lastTime && new Date().getTime() - lastTime < 500) {
          return false;
        }
        errorCache.set(error.message, new Date().getTime());
        return true;
      });
      if (errs.length === 0) {
        throw error;
      }

      notify('error', errs, this.notification);
    }
    throw error;
  }

  useNotificationMiddleware() {
    const errorHandler = this.handleNotificationError.bind(this);
    errorHandler['_name'] = 'handleNotificationError';
    this.axios.interceptors.response.use((response) => {
      if (response.data?.messages?.length) {
        const messages = response.data.messages.filter((item) => {
          const lastTime = errorCache.get(typeof item === 'string' ? item : item.message);
          if (lastTime && new Date().getTime() - lastTime < 500) {
            return false;
          }
          errorCache.set(item.message, new Date().getTime());
          return true;
        });
        notify('success', messages, this.notification);
      }
      return response;
    }, errorHandler);
  }

  silent() {
    const api = this.cloneInstance();
    api.silence = true;
    return api;
  }
}
