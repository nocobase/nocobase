/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin, type CollectionTemplateField } from '@nocobase/client-v2';
import React, { ComponentType } from 'react';
import { FieldInterfaceConfigureOptions } from './field-interfaces';
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

export interface CollectionTemplateFormProps {
  mode: 'create' | 'edit';
  template: CollectionTemplateOptions;
  form: any;
}

export interface CollectionTemplateConfigureItemProps extends CollectionTemplateFormProps {
  item: CollectionTemplateConfigureItem;
}

export interface CollectionTemplateConfigureItem {
  name?: string;
  label?: React.ReactNode;
  Component?: ComponentType<CollectionTemplateConfigureItemProps>;
  componentProps?: Record<string, unknown>;
  required?: boolean;
  hidden?: boolean | ((props: CollectionTemplateFormProps) => boolean);
}

export interface CollectionTemplateOptions {
  name?: string;
  title: React.ReactNode;
  order?: number;
  color?: string;
  divider?: boolean;
  collection?: {
    options?: Record<string, any> | (() => Record<string, any>);
    fields?: CollectionTemplateField[] | (() => CollectionTemplateField[]);
  };
  capabilities?: {
    recordUniqueKey?: boolean;
    simplePaginate?: boolean;
  };
  configure?: {
    items?: CollectionTemplateConfigureItem[];
    Form?: ComponentType<CollectionTemplateFormProps>;
    transformSubmitValues?: (values: Record<string, any>) => Record<string, any> | void;
  };
  fieldInterfaces?: {
    include?: string[];
    exclude?: string[];
  };
  presetFields?: {
    disabled?: boolean;
    disabledIncludes?: string[];
  };
  actions?: unknown[];
  /**
   * @deprecated Use collection.options instead.
   */
  defaultValues?: Record<string, any> | (() => Record<string, any>);
  /**
   * @deprecated Use presetFields.disabled instead.
   */
  presetFieldsDisabled?: boolean;
  /**
   * @deprecated Use presetFields.disabledIncludes instead.
   */
  presetFieldsDisabledIncludes?: string[];
  /**
   * @deprecated Use configure.Form instead.
   */
  ConfigureForm?: ComponentType<CollectionTemplateFormProps>;
  /**
   * @deprecated Use configure.transformSubmitValues instead.
   */
  beforeSubmit?: (values: Record<string, any>) => void;
}

class CollectionTemplateRegistry {
  protected templates = new Map<string, CollectionTemplateOptions>();

  register(nameOrOptions: string | CollectionTemplateOptions, options?: CollectionTemplateOptions) {
    const template =
      typeof nameOrOptions === 'string' ? { ...options, name: options?.name || nameOrOptions } : nameOrOptions;
    if (!template?.name) {
      return;
    }
    this.templates.set(template.name, {
      ...template,
      name: template.name,
    });
  }

  get(name?: string) {
    return name ? this.templates.get(name) : undefined;
  }

  getAll() {
    return [...this.templates.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
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
  collectionTemplateRegistry = new CollectionTemplateRegistry();

  async load() {
    this.registerBuiltInCollectionTemplates();

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
    this.dataSourceManager.collectionFieldInterfaceManager?.registerFieldInterfaceConfigure?.(options);
  }

  registerCollectionTemplate(nameOrOptions: string | CollectionTemplateOptions, options?: CollectionTemplateOptions) {
    this.collectionTemplateRegistry.register(nameOrOptions, options);
  }

  getCollectionTemplate(name?: string) {
    return this.collectionTemplateRegistry.get(name);
  }

  getCollectionTemplates() {
    return this.collectionTemplateRegistry.getAll();
  }

  private registerBuiltInCollectionTemplates() {
    this.registerCollectionTemplate({
      name: 'general',
      title: 'General collection',
      order: 10,
      color: 'blue',
      collection: {
        options: {
          template: 'general',
        },
        fields: [],
      },
    });

    this.registerCollectionTemplate({
      name: 'tree',
      title: 'Tree collection',
      order: 30,
      color: 'blue',
      collection: {
        options: {
          template: 'tree',
          tree: 'adjacencyList',
        },
        fields: [
          {
            interface: 'integer',
            name: 'parentId',
            type: 'bigInt',
            title: '{{t("Parent ID")}}',
            isForeignKey: true,
            uiSchema: {
              'x-read-pretty': true,
            },
          },
          {
            interface: 'm2o',
            type: 'belongsTo',
            name: 'parent',
            title: '{{t("Parent")}}',
            foreignKey: 'parentId',
            treeParent: true,
            onDelete: 'CASCADE',
            componentProps: {
              multiple: false,
              fieldNames: {
                label: 'id',
                value: 'id',
              },
            },
          },
          {
            interface: 'o2m',
            type: 'hasMany',
            name: 'children',
            title: '{{t("Children")}}',
            foreignKey: 'parentId',
            treeChildren: true,
            onDelete: 'CASCADE',
            componentProps: {
              multiple: true,
              fieldNames: {
                label: 'id',
                value: 'id',
              },
            },
          },
        ],
      },
      presetFields: {
        disabledIncludes: ['id'],
      },
      configure: {
        transformSubmitValues(values) {
          if (!Array.isArray(values.fields)) {
            return;
          }
          values.fields = values.fields.map((field) => {
            if (!field.target && ['belongsToMany', 'belongsTo', 'hasMany', 'hasOne'].includes(field.type)) {
              return { ...field, target: values.name };
            }
            return field;
          });

          const primaryKey = values.fields.find((field) => field.primaryKey);
          const parentId = values.fields.find((field) => field.name === 'parentId' && field.isForeignKey);
          if (primaryKey && parentId) {
            const parentIdTitle = parentId.uiSchema?.title;
            parentId.interface = primaryKey.interface;
            parentId.type = primaryKey.type;
            parentId.uiSchema = structuredClone(primaryKey.uiSchema || {});
            parentId.uiSchema.title = parentIdTitle;
            parentId.autoFill = false;
          }
        },
      },
    });

    this.registerCollectionTemplate({
      name: 'sql',
      title: 'SQL collection',
      order: 40,
      color: 'yellow',
      divider: true,
      collection: {
        options: {
          template: 'sql',
        },
        fields: [],
      },
      capabilities: {
        recordUniqueKey: true,
      },
    });

    this.registerCollectionTemplate({
      name: 'view',
      title: 'Connect to database view',
      order: 50,
      color: 'yellow',
      divider: true,
      collection: {
        options: {
          template: 'view',
          view: true,
        },
        fields: [],
      },
      capabilities: {
        recordUniqueKey: true,
        simplePaginate: true,
      },
    });
  }
}

export default PluginDataSourceManagerClientV2;
