/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type APIClientOptions, getSubAppName } from '@nocobase/sdk';
import { createInstance, type i18n as i18next } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { APIClient } from './APIClient';
import { BaseApplication, type BaseApplicationOptions } from './BaseApplication';
import { CollectionFieldInterfaceManager } from './collection-field-interface/CollectionFieldInterfaceManager';
import type { PluginType } from './PluginManager';
import { PluginManager } from './PluginManager';
import { PluginSettingsManager } from './PluginSettingsManager';
import type { RouterOptions } from './RouterManager';
import { RouterManager } from './RouterManager';
import type { WebSocketClientOptions } from './WebSocketClient';
import CSSVariableProvider from './css-variable/CSSVariableProvider';

export type { DevDynamicImport, ComponentAndProps } from './BaseApplication';
export { ApplicationModel } from './BaseApplication';

export interface ApplicationOptions extends BaseApplicationOptions<PluginType> {
  apiClient?: APIClientOptions;
  ws?: WebSocketClientOptions | boolean;
  i18n?: i18next;
  plugins?: PluginType[];
  components?: BaseApplicationOptions<PluginType>['components'];
  router?: RouterOptions;
}

export class Application extends BaseApplication<
  ApplicationOptions,
  PluginManager,
  RouterManager,
  APIClient,
  PluginSettingsManager
> {
  public declare dataSourceManager: any;
  public hasLoadError = false;

  protected createApiClient(options: ApplicationOptions) {
    return new APIClient({
      ...options.apiClient,
      appName: options.name || getSubAppName(options.publicPath),
    });
  }

  protected configureRuntimeAdapters() {
    this.dataSourceManager = this.flowEngine.context.dataSourceManager;
    this.dataSourceManager.setRequester(this.apiClient.request.bind(this.apiClient));
    if (!this.dataSourceManager.collectionFieldInterfaceManager) {
      this.dataSourceManager.setCollectionFieldInterfaceManager(
        new CollectionFieldInterfaceManager(this.dataSourceManager),
      );
    }
  }

  protected createI18n(options: ApplicationOptions) {
    if (options.i18n) {
      return options.i18n;
    }

    const i18n = createInstance();

    i18n.use(initReactI18next).init({
      lng: 'en-US',
      defaultNS: 'client',
      resources: {},
      keySeparator: false,
      nsSeparator: false,
    });

    return i18n;
  }

  protected createRouterManager(options: ApplicationOptions) {
    const router = new RouterManager(options.router, this);
    if (options.router?.basename === undefined) {
      const publicPath = this.getPublicPath();
      const basename = publicPath === '/' ? undefined : publicPath.replace(/\/$/, '');
      if (basename) {
        router.setBasename(basename);
      }
    }
    return router;
  }

  protected createPluginManager(options: ApplicationOptions): PluginManager {
    return new PluginManager(options.plugins || [], Boolean(options.loadRemotePlugins), this);
  }

  protected createPluginSettingsManager(_options: ApplicationOptions): PluginSettingsManager {
    return new PluginSettingsManager(this);
  }

  async load() {
    try {
      this.hasLoadError = false;
      await this.loadWebSocket();
      await this.pm.load();
      await this.flowEngine.flowSettings.load();
    } catch (error: any) {
      this.hasLoadError = true;

      if (error?.response?.data?.errors?.[0]?.code === 'BLOCKED_IP') {
        this.hasLoadError = false;
      }

      if (this.ws.enabled) {
        await new Promise((resolve) => {
          setTimeout(() => resolve(null), 1000);
        });
      }
      this.error = {
        code: 'LOAD_ERROR',
        ...this.apiClient.toErrMessages(error)?.[0],
      };
      console.error(error, this.error);
    }
    this.updateFavicon();
  }

  async loadWebSocket() {
    this.eventBus.addEventListener('ws:message:authorized', () => {
      this.setWsAuthorized(true);
    });

    this.ws.on('message', (event: { data?: string }) => {
      if (!event.data) {
        return;
      }
      const data = JSON.parse(event.data);

      if (data?.payload?.refresh) {
        globalThis.window.location.reload();
        return;
      }

      if (data.type === 'notification') {
        const notification = this.context.notification as unknown as Record<
          string,
          (config: { message?: string }) => void
        >;
        notification[data.payload?.type || 'info']?.({ message: data.payload?.message });
        return;
      }

      const maintaining = data.type === 'maintaining' && data.payload.code !== 'APP_RUNNING';
      if (maintaining) {
        this.setMaintaining(true);
        this.error = data.payload;
      } else {
        if (this.hasLoadError) {
          globalThis.window.location.reload();
        }
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

  protected addCustomProviders() {
    this.use(CSSVariableProvider);
  }

  addFieldInterfaces(fieldInterfaceClasses: any[] = []) {
    return this.dataSourceManager.addFieldInterfaces(fieldInterfaceClasses);
  }

  addFieldInterfaceGroups(groups: Record<string, { label: string; order?: number }>) {
    return this.dataSourceManager.addFieldInterfaceGroups(groups);
  }

  addFieldInterfaceComponentOption(fieldName: string, componentOption: any) {
    return this.dataSourceManager.addFieldInterfaceComponentOption(fieldName, componentOption);
  }

  addFieldInterfaceOperator(name: string, operatorOption: any) {
    return this.dataSourceManager.addFieldInterfaceOperator(name, operatorOption);
  }

  registerFieldFilterOperator(operator: any) {
    return this.dataSourceManager.registerFieldFilterOperator(operator);
  }

  registerFieldFilterOperatorGroup(name: string, operators: any[] = []) {
    return this.dataSourceManager.registerFieldFilterOperatorGroup(name, operators);
  }

  addFieldFilterOperatorsToGroup(name: string, operators: any[] = []) {
    return this.dataSourceManager.addFieldFilterOperatorsToGroup(name, operators);
  }

  registerFieldValidationConfigure(item: any) {
    return this.dataSourceManager.collectionFieldInterfaceManager?.registerFieldValidationConfigure?.(item);
  }

  registerFieldValidationConfigureGroup(name: string, items: any[] = []) {
    return this.dataSourceManager.collectionFieldInterfaceManager?.registerFieldValidationConfigureGroup?.(name, items);
  }

  addFieldValidationConfiguresToGroup(name: string, items: any[] = []) {
    return this.dataSourceManager.collectionFieldInterfaceManager?.addFieldValidationConfiguresToGroup?.(name, items);
  }
}
