/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient as APIClientSDK, getSubAppName } from '@nocobase/sdk';
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

  getHeaders() {
    const headers = super.getHeaders();
    const appName = this.app.getName();
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

  setPermanentCookie(name: string, value: string) {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 100);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = name + '=' + value + ';' + expires + ';path=/';
  }

  interceptors() {
    this.axios.interceptors.request.use((config) => {
      config.headers['X-With-ACL-Meta'] = true;
      const appName = this.app ? getSubAppName(this.app.getPublicPath()) : null;
      if (appName) {
        config.headers['X-App'] = appName;
      }
      this.setPermanentCookie('__appName', appName || 'main');
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
        }
        if (errs.find((error: { code?: string }) => error.code === 'TOKEN_INVALID')) {
          this.auth.setToken(null);
        }
        throw error;
      },
    );
  }

  toErrMessages(error) {
    if (typeof error?.response?.data === 'string') {
      return [{ message: error?.response?.data }];
    }
    return (
      error?.response?.data?.errors ||
      error?.response?.data?.messages ||
      error?.response?.error || [{ message: error.message || 'Server error' }]
    );
  }

  useNotificationMiddleware() {
    this.axios.interceptors.response.use(
      (response) => {
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
      },
      async (error) => {
        if (this.silence) {
          console.error(error);
          return;
          // throw error;
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
      },
    );
  }

  silent() {
    this.silence = true;
    return this;
  }
}
