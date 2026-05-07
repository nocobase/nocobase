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
  type WebSocketClientOptions,
} from '@nocobase/client-v2';
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
import { SystemSettingsSource } from '@nocobase/client-v2';
import { i18n } from '../i18n';
import { OpenModeProvider } from '../modules/popup/OpenModeProvider';
import { defineGlobalDeps } from './utils/globalDeps';
import { AppSchemaComponentProvider } from './AppSchemaComponentProvider';
import { PluginManager, type PluginType } from './PluginManager';
import type { PluginClass } from './PluginManager';
import { PluginSettingOptions, PluginSettingsManager } from './PluginSettingsManager';
import { RouterManager, type RouterOptions } from './RouterManager';
import { SchemaInitializer, SchemaInitializerManager } from './schema-initializer';
import {
  SchemaInitializerActionModal,
  SchemaInitializerActionModalInternal,
} from './schema-initializer/components/SchemaInitializerActionModal';
import {
  SchemaInitializerChildren,
  SchemaInitializerChild,
} from './schema-initializer/components/SchemaInitializerChildren';
import { SchemaInitializerDivider } from './schema-initializer/components/SchemaInitializerDivider';
import {
  SchemaInitializerItem,
  SchemaInitializerItemInternal,
} from './schema-initializer/components/SchemaInitializerItem';
import {
  SchemaInitializerItemGroup,
  SchemaInitializerItemGroupInternal,
} from './schema-initializer/components/SchemaInitializerItemGroup';
import { SchemaInitializerItems } from './schema-initializer/components/SchemaInitializerItems';
import {
  SchemaInitializerSelect,
  SchemaInitializerSelectInternal,
} from './schema-initializer/components/SchemaInitializerSelect';
import {
  SchemaInitializerSubMenu,
  SchemaInitializerSubMenuInternal,
} from './schema-initializer/components/SchemaInitializerSubMenu';
import {
  SchemaInitializerSwitch,
  SchemaInitializerSwitchInternal,
} from './schema-initializer/components/SchemaInitializerSwitch';
import { SchemaSettings, SchemaSettingsItemType, SchemaSettingsManager } from './schema-settings';

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

export type { ComponentAndProps };
export type DevDynamicImport = (packageName: string) => Promise<{ default: PluginClass }>;

export interface ApplicationOptions extends BaseApplicationOptions<PluginType> {
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

export class Application extends BaseApplication<
  ApplicationOptions,
  PluginManager,
  RouterManager,
  APIClient,
  PluginSettingsManager
> {
  public declare devDynamicImport?: DevDynamicImport;
  public declare schemaInitializerManager: SchemaInitializerManager;
  public declare schemaSettingsManager: SchemaSettingsManager;
  public declare dataSourceManager: DataSourceManager;
  public globalVars: Record<string, any> = {};
  public globalVarCtxs: Record<string, any> = {};
  public declare jsonLogic: JsonLogic;
  loading = true;
  hasLoadError = false;
  locales = null;

  private readonly variables: Variable[] = [];

  protected initRequireJs() {
    super.initRequireJs();
    if (this.requirejs) {
      defineGlobalDeps(this.requirejs);
    }
  }

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

  protected createPluginManager(options: ApplicationOptions): PluginManager {
    return new PluginManager(options.plugins, options.loadRemotePlugins, this);
  }

  protected createPluginSettingsManager(options: ApplicationOptions): PluginSettingsManager {
    return new PluginSettingsManager(options.pluginSettings, this);
  }

  protected getDefaultComponents() {
    return {
      ...super.getDefaultComponents(),
      DataBlockProvider,
      SchemaInitializerActionModal,
      SchemaInitializerActionModalInternal,
      SchemaInitializerChildren,
      SchemaInitializerChild,
      SchemaInitializerDivider,
      SchemaInitializerItem,
      SchemaInitializerItemGroup,
      SchemaInitializerItemGroupInternal,
      SchemaInitializerItemInternal,
      SchemaInitializerItems,
      SchemaInitializerSelect,
      SchemaInitializerSelectInternal,
      SchemaInitializerSubMenu,
      SchemaInitializerSubMenuInternal,
      SchemaInitializerSwitch,
      SchemaInitializerSwitchInternal,
      CollectionField,
    };
  }

  protected initializeExtendedState() {
    super.initializeExtendedState();
    this.systemSettings = new SystemSettingsSource(this.apiClient as APIClient);
    this.schemaSettingsManager = new SchemaSettingsManager(this.options.schemaSettings, this);
    this.schemaInitializerManager = new SchemaInitializerManager(this.options.schemaInitializers, this);
    this.dataSourceManager = new DataSourceManager(this.options.dataSourceManager, this);
    this.loading = true;
    this.hasLoadError = false;
    this.locales = null;
  }

  protected afterManagersInitialized() {
    super.afterManagersInitialized();
    this.jsonLogic = getOperators();
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

  async load() {
    try {
      this.loading = true;
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
    this.loading = false;
    this.updateFavicon();
  }

  async loadWebSocket() {
    this.eventBus.addEventListener('ws:message:authorized', () => {
      this.setWsAuthorized(true);
    });

    this.ws.on('message', (event: any) => {
      const data = JSON.parse(event.data);

      if (data?.payload?.refresh) {
        window.location.reload();
        return;
      }

      if (data.type === 'notification') {
        // @ts-ignore
        this.context.notification[data.payload?.type || 'info']?.({ message: data.payload?.message });
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

  addFieldInterfaceGroups(groups: Record<string, { label: string; order?: number }>) {
    return this.dataSourceManager.addFieldInterfaceGroups(groups);
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

  getGlobalVar(key: string) {
    return get(this.globalVars, key);
  }

  getGlobalVarCtx(key: string) {
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
