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
    message: messages.map?.((item: any) => {
      return React.createElement('div', {}, typeof item === 'string' ? item : item.message);
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

const errorCache = new Map();
export class APIClient extends APIClientSDK {
  services: Record<string, Result<any, any>> = {};
  silence = false;
  app: Application;
  /** 该值会在 AntdAppProvider 中被重新赋值 */
  notification: any = notification;

  service(uid: string) {
    return this.services[uid];
  }

  interceptors() {
    this.axios.interceptors.request.use((config) => {
      config.headers['X-With-ACL-Meta'] = true;
      const appName = this.app ? getSubAppName(this.app.getPublicPath()) : null;
      if (appName) {
        config.headers['X-App'] = appName;
      }
      return config;
    });
    super.interceptors();
    this.useNotificationMiddleware();
    this.axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        const errs = error?.response?.data?.errors || [{ message: 'Server error' }];
        // Hard code here temporarily
        // TODO(yangqia): improve error code and message
        if (errs.find((error: { code?: string }) => error.code === 'ROLE_NOT_FOUND_ERR')) {
          this.auth.setRole(null);
        }
        throw error;
      },
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
      (error) => {
        if (this.silence) {
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
          let errs = error?.response?.data?.errors || error?.response?.data?.messages || [{ message: 'Server error' }];
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
