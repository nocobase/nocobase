/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import React, { ComponentType } from 'react';
import { FieldInterfaceConfigureOptions, FieldInterfaceConfigureRegistry } from './field-interfaces';
import { NAMESPACE } from './locale';
import { syncDataSourcesToRuntime } from './runtime';

export interface DataSourceSettingsFormProps {
  mode: 'create' | 'edit';
  type: DataSourceTypeOptions;
  initialValues?: Record<string, any>;
  loadCollections: (key: string) => Promise<any>;
}

export interface DataSourceTypeOptions {
  name?: string;
  label?: React.ReactNode;
  defaultValues?: Record<string, any>;
  disableTestConnection?: boolean;
  SettingsForm?: ComponentType<DataSourceSettingsFormProps>;
}

class ExtensionManager {
  protected managerActions: Array<{ order: number; component: ComponentType }> = [];

  registerManagerAction({ order, component }: { order?: number; component: ComponentType }) {
    this.managerActions.push({ order: order ?? 0, component });
  }

  getManagerActions() {
    return [...this.managerActions].sort((a, b) => a.order - b.order);
  }
}

export class PluginDataSourceManagerClientV2 extends Plugin<any, Application> {
  types = new Map<string, DataSourceTypeOptions>();
  extensionManager = new ExtensionManager();
  fieldInterfaceConfigureRegistry = new FieldInterfaceConfigureRegistry();

  async load() {
    this.dataSourceManager.registerLoader('*', async () => {
      const response = await this.app.apiClient.request({
        resource: 'dataSources',
        action: 'listEnabled',
        params: {
          paginate: false,
          appends: ['collections'],
        },
      });
      const dataSources = response?.data?.data || [];
      syncDataSourcesToRuntime(this.dataSourceManager, dataSources);
      return { dataSources };
    });

    this.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title: this.t('Data sources'),
      icon: 'ClusterOutlined',
      isPinned: true,
      sort: 100,
      showTabs: false,
      aclSnippet: 'pm.data-source-manager*',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'index',
      title: this.t('Data sources'),
      componentLoader: () => import('./pages/DataSourcesPage'),
      sort: 1,
      aclSnippet: 'pm.data-source-manager',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'collections',
      title: this.t('Collections'),
      componentLoader: () => import('./pages/DataSourceCollectionsPage'),
      sort: 2,
      aclSnippet: 'pm.data-source-manager',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'collections/:dataSourceKey',
      title: this.t('Collections'),
      componentLoader: () => import('./pages/DataSourceCollectionsPage'),
      hidden: true,
      sort: 3,
      aclSnippet: 'pm.data-source-manager',
    });
  }

  registerType(name: string, options: DataSourceTypeOptions) {
    this.types.set(name, {
      ...options,
      name: options.name || name,
    });
  }

  getType(name?: string) {
    return name ? this.types.get(name) : undefined;
  }

  registerFieldInterfaceConfigure(options: FieldInterfaceConfigureOptions) {
    this.fieldInterfaceConfigureRegistry.register(options);
  }
}

export default PluginDataSourceManagerClientV2;
