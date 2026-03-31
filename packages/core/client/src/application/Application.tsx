/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import {
  BaseApplication,
  type BaseApplicationOptions,
  type ComponentAndProps,
  type DevDynamicImport,
  WebSocketClient,
  type WebSocketClientOptions,
} from '@nocobase/client-v2';
import { type FlowEngineContext } from '@nocobase/flow-engine';
import { APIClientOptions, getSubAppName } from '@nocobase/sdk';
import { i18n as i18next } from 'i18next';
import get from 'lodash/get';
import merge from 'lodash/merge';
import set from 'lodash/set';
import type { ComponentType } from 'react';

import { APIClient, APIClientProvider } from '../api-client';
import { CSSVariableProvider } from '../css-variable';
import type { CollectionFieldInterfaceFactory } from '../data-source';
import { CollectionFieldInterfaceComponentOption } from '../data-source/collection-field-interface/CollectionFieldInterface';
import { CollectionField } from '../data-source/collection-field/CollectionField';
import { DataSourceApplicationProvider } from '../data-source/components/DataSourceApplicationProvider';
import { DataBlockProvider } from '../data-source/data-block/DataBlockProvider';
import { DataSourceManager, type DataSourceManagerOptions } from '../data-source/data-source/DataSourceManager';
import { SystemSettingsSource } from '../flow/system-settings';
import { i18n } from '../i18n';
import { OpenModeProvider } from '../modules/popup/OpenModeProvider';
import { AppSchemaComponentProvider } from './AppSchemaComponentProvider';
import { BlankComponent, defaultAppComponents } from './components';
import { HeaderActionsManager } from './HeaderActionsManager';
import { PluginManager, type PluginType } from './PluginManager';
import { PluginSettingOptions, PluginSettingsManager } from './PluginSettingsManager';
import { RouteRepository } from './RouteRepository';
import { RouterManager, type RouterOptions } from './RouterManager';
import { SchemaInitializer, SchemaInitializerManager } from './schema-initializer';
import * as schemaInitializerComponents from './schema-initializer/components';
import { SchemaSettings, SchemaSettingsItemType, SchemaSettingsManager } from './schema-settings';
import { compose } from './utils';

import { AIManager } from '../flow/ai';
import { getOperators } from './globalOperators';
import { useAclSnippets } from './hooks/useAclSnippets';

type JsonLogic = {
  addOperation: (name: string, fn?: any) => void;
  rmOperation: (name: string) => void;
};

/**
 * Reference: https://ant.design/components/cascader-cn#option
 */
interface VariableOption {
  value: string | number;
  label?: React.ReactNode;
  disabled?: boolean;
  children?: VariableOption[];
}

interface Variable {
  name: string;
  useOption: () => { option: VariableOption; visible?: boolean };
  useCtx: () => any | ((param: { variableName: string }) => Promise<any>);
}

export type { ComponentAndProps, DevDynamicImport };

export interface ApplicationOptions extends BaseApplicationOptions {
  apiClient?: APIClientOptions | APIClient;
  ws?: WebSocketClientOptions | boolean;
  i18n?: i18next;
  providers?: (ComponentType | ComponentAndProps)[];
  plugins?: PluginType[];
  components?: Record<string, ComponentType>;
  scopes?: Record<string, any>;
  router?: RouterOptions;
  pluginSettings?: Record<string, PluginSettingOptions>;
  schemaSettings?: SchemaSettings[];
  schemaInitializers?: SchemaInitializer[];
  dataSourceManager?: DataSourceManagerOptions;
}

export class Application extends BaseApplication<ApplicationOptions> {
  public declare apiClient: APIClient;
  public declare router: RouterManager;
  public declare ws: WebSocketClient;
  public declare pluginManager: PluginManager;
  public declare pluginSettingsManager: PluginSettingsManager;
  public declare aiManager: AIManager;
  public declare schemaInitializerManager: SchemaInitializerManager;
  public declare schemaSettingsManager: SchemaSettingsManager;
  public declare dataSourceManager: DataSourceManager;
  public declare headerActionsManager: HeaderActionsManager;
  public globalVars: Record<string, any> = {};
  public globalVarCtxs: Record<string, any> = {};
  public declare jsonLogic: JsonLogic;
  public declare systemSettings: SystemSettingsSource;
  public declare context: FlowEngineContext & {
    pluginSettingsRouter: PluginSettingsManager;
    pluginManager: PluginManager;
  };
  loading = true;
  hasLoadError = false;
  locales = null;

  private readonly variables: Variable[] = [];

  protected defineObservableState() {
    super.defineObservableState();
    define(this, {
      loading: observable.ref,
    });
  }

  protected createApiClient(options: ApplicationOptions) {
    const apiClient =
      options.apiClient instanceof APIClient
        ? options.apiClient
        : new APIClient({
            ...options.apiClient,
            appName: this.options.name || getSubAppName(options.publicPath),
          });
    apiClient.app = this;
    return apiClient;
  }

  protected createI18n(options: ApplicationOptions) {
    return options.i18n || i18n;
  }

  protected createRouterManager(options: ApplicationOptions) {
    return new RouterManager(options.router, this);
  }

  protected createPluginManager(options: ApplicationOptions) {
    return new PluginManager(options.plugins, options.loadRemotePlugins, this);
  }

  protected createPluginSettingsManager(options: ApplicationOptions) {
    return new PluginSettingsManager(options.pluginSettings, this);
  }

  protected createWebSocketClient(options: ApplicationOptions) {
    return new WebSocketClient(options.ws);
  }

  protected getDefaultComponents() {
    return {
      DataBlockProvider,
      ...defaultAppComponents,
      ...schemaInitializerComponents,
      CollectionField,
    };
  }

  protected initializeExtendedState() {
    this.systemSettings = new SystemSettingsSource(this.apiClient as APIClient);
    this.headerActionsManager = new HeaderActionsManager(this.eventBus);
    this.schemaSettingsManager = new SchemaSettingsManager(this.options.schemaSettings, this);
    this.schemaInitializerManager = new SchemaInitializerManager(this.options.schemaInitializers, this);
    this.dataSourceManager = new DataSourceManager(this.options.dataSourceManager, this);
    this.loading = true;
    this.hasLoadError = false;
    this.locales = null;
  }

  protected afterManagersInitialized() {
    this.jsonLogic = getOperators();
    this.aiManager = new AIManager(this);
  }

  protected configureContext() {
    this.flowEngine.context.defineProperty('routeRepository', {
      value: new RouteRepository(this.flowEngine.context),
    });
    this.flowEngine.context.defineProperty('appInfo', {
      get: async () => {
        const rest = await this.apiClient.request({
          url: 'app:getInfo',
        });
        return rest.data?.data || {};
      },
    });
    const pageInfo = observable({ version: undefined as 'v2' | 'v1' | undefined });
    this.flowEngine.context.defineProperty('pageInfo', { value: pageInfo });
    this.flowEngine.context.defineProperty('systemSettings', {
      value: this.systemSettings,
    });
  }

  protected addCustomProviders() {
    this.use(APIClientProvider, { apiClient: this.apiClient as APIClient });
    this.use(CSSVariableProvider);
    this.use(AppSchemaComponentProvider, {
      designable: this.options.designable,
      appName: this.name,
      components: this.components,
      scope: this.scopes,
    });
    this.use(DataSourceApplicationProvider, { dataSourceManager: this.dataSourceManager });
    this.use(OpenModeProvider);
  }

  protected getRootFallback() {
    return this.renderComponent('AppSpin', { app: this });
  }

  getCollectionManager(dataSource?: string) {
    return this.dataSourceManager.getDataSource(dataSource)?.collectionManager;
  }

  getComposeProviders() {
    const Providers = compose(...this.providers)(BlankComponent);
    Providers.displayName = 'Providers';
    return Providers;
  }

  async load() {
    try {
      this.loading = true;
      await this.loadWebSocket();
      await this.pm.load();
      await this.flowEngine.flowSettings.load();
    } catch (error) {
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
    this.loading = false;
    this.updateFavicon();
  }

  async loadWebSocket() {
    this.eventBus.addEventListener('ws:message:authorized', () => {
      this.setWsAuthorized(true);
    });

    this.ws.on('message', (event) => {
      const data = JSON.parse(event.data);

      if (data?.payload?.refresh) {
        window.location.reload();
        return;
      }

      if (data.type === 'notification') {
        this.context.notification[data.payload?.type || 'info']({ message: data.payload?.message });
        return;
      }

      const maintaining = data.type === 'maintaining' && data.payload.code !== 'APP_RUNNING';
      if (maintaining) {
        this.setMaintaining(true);
        this.error = data.payload;
      } else {
        if (this.hasLoadError) {
          window.location.reload();
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

  addScopes(scopes: Record<string, any>) {
    this.scopes = merge(this.scopes, scopes);
  }

  addFieldInterfaces(fieldInterfaceClasses: CollectionFieldInterfaceFactory[] = []) {
    return this.dataSourceManager.collectionFieldInterfaceManager.addFieldInterfaces(fieldInterfaceClasses);
  }

  addFieldInterfaceComponentOption(fieldName: string, componentOption: CollectionFieldInterfaceComponentOption) {
    return this.dataSourceManager.collectionFieldInterfaceManager.addFieldInterfaceComponentOption(
      fieldName,
      componentOption,
    );
  }

  /**
   * 为指定的字段接口添加操作符选项
   *
   * @param name 字段接口的名称
   * @param operatorOption 要添加的操作符选项
   */
  addFieldInterfaceOperator(name: string, operatorOption: any) {
    return this.dataSourceManager.collectionFieldInterfaceManager.addFieldInterfaceOperator(name, operatorOption);
  }

  addGlobalVar(key: string, value: any, varCtx?: any) {
    set(this.globalVars, key, value);
    if (varCtx) {
      set(this.globalVarCtxs, key, varCtx);
    }
  }

  getGlobalVar(key) {
    return get(this.globalVars, key);
  }

  getGlobalVarCtx(key) {
    return get(this.globalVarCtxs, key);
  }

  addUserCenterSettingsItem(item: SchemaSettingsItemType & { aclSnippet?: string }) {
    const useVisibleProp = item.useVisible || (() => true);
    const useVisible = () => {
      const { allow } = useAclSnippets();
      const visible = useVisibleProp();
      if (!visible) {
        return false;
      }
      return item.aclSnippet ? allow(item.aclSnippet) : true;
    };

    this.schemaSettingsManager.addItem('userCenterSettings', item.name, {
      ...item,
      useVisible: useVisible,
    });
  }

  registerVariable(variable: Variable) {
    if (this.variables.find((item) => item.name === variable.name)) {
      console.warn(`Variable ${variable.name} already registered`);
      return;
    }
    this.variables.push(variable);
  }

  getVariables() {
    return this.variables;
  }

  setAppsComponent({ Component }: { Component: ComponentType }) {
    this.apps.Component = Component;
  }
}
