/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient, type APIClientOptions } from '@nocobase/sdk';
import { createInstance, type i18n as i18next } from 'i18next';
import React, { type ComponentType } from 'react';

import { BaseApplication, type BaseApplicationOptions } from './BaseApplication';
import type { PluginType } from './PluginManager';
import { PluginManager } from './PluginManager';
import type { PluginSettingOptions } from './PluginSettingsManager';
import { PluginSettingsManager } from './PluginSettingsManager';
import type { RouterOptions } from './RouterManager';
import { RouterManager } from './RouterManager';
import type { WebSocketClientOptions } from './WebSocketClient';

export type { DevDynamicImport, ComponentAndProps } from './BaseApplication';
export { ApplicationModel } from './BaseApplication';

export interface ApplicationOptions extends BaseApplicationOptions {
  apiClient?: APIClientOptions;
  ws?: WebSocketClientOptions | boolean;
  i18n?: i18next;
  plugins?: PluginType[];
  components?: Record<string, ComponentType>;
  router?: RouterOptions;
  pluginSettings?: Record<string, PluginSettingOptions>;
}

export class Application extends BaseApplication<ApplicationOptions> {
  protected createApiClient(options: ApplicationOptions) {
    return new APIClient(options.apiClient);
  }

  protected createI18n(options: ApplicationOptions) {
    return options.i18n || createInstance();
  }

  protected createRouterManager(options: ApplicationOptions) {
    const router = new RouterManager(options.router, this);
    if (typeof options.router?.basename === 'undefined') {
      const publicPath = this.getPublicPath();
      const basename = publicPath === '/' ? undefined : publicPath.replace(/\/$/, '');
      if (basename) {
        router.setBasename(basename);
      }
    }
    return router;
  }

  protected createPluginManager(options: ApplicationOptions) {
    return new PluginManager(options.plugins, options.loadRemotePlugins, this);
  }

  protected createPluginSettingsManager(options: ApplicationOptions) {
    return new PluginSettingsManager(options.pluginSettings, this);
  }

  protected getDefaultComponents() {
    return {
      AppNotFound: () => <div>Not Found</div>,
      AppError: () => <div>{this.error?.message}</div>,
      AppSpin: () => <div>Loading</div>,
      AppMaintaining: () => <div>Maintaining</div>,
      AppMaintainingDialog: () => <div>Maintaining Dialog</div>,
    };
  }

  async load() {
    await this.loadWebSocket();
    await this.pm.load();
    await this.flowEngine.flowSettings.load();
    this.updateFavicon();
  }

  async loadWebSocket() {
    this.eventBus.addEventListener('ws:message:authorized', () => {
      this.setWsAuthorized(true);
    });

    this.ws.on('message', (event) => {
      if (!event.data) {
        return;
      }
      const data = JSON.parse(event.data);

      if (data?.payload?.refresh) {
        window.location.reload();
        return;
      }

      if (data.type === 'notification') {
        this.context.notification[data.payload?.type || 'info']({ message: data.payload?.message });
        return;
      }

      if (this.error && data.payload.code === 'APP_RUNNING') {
        this.maintained = true;
        this.setMaintaining(false);
        this.error = null;
        window.location.reload();
        return;
      }

      const maintaining = data.type === 'maintaining' && data.payload.code !== 'APP_RUNNING';
      console.log('ws:message', { maintaining, data });
      if (maintaining) {
        this.setMaintaining(true);
        this.error = data.payload;
      } else {
        this.setMaintaining(false);
        this.maintained = true;
        this.error = null;

        const type = data.type;
        if (!type) {
          return;
        }

        const eventName = `ws:message:${type}`;
        this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data.payload }));
      }
    });

    this.ws.on('serverDown', () => {
      this.maintaining = true;
      this.maintained = false;
    });

    this.ws.on('open', () => {
      const token = this.apiClient.auth.token;

      if (token) {
        this.setTokenInWebSocket({ token, authenticator: this.apiClient.auth.getAuthenticator() });
      }
    });

    this.ws.connect();
  }
}
