/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import {
  BaseRecordResource,
  buildSubModelItems,
  Collection,
  CollectionField,
  DataSource,
  DefaultStructure,
  tExpr,
  FlowModelContext,
  MultiRecordResource,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import type { FlowEngine } from '@nocobase/flow-engine';
import _ from 'lodash';
import { createDefaultCollectionBlockTitle } from '../../utils/blockUtils';
import { FilterManager } from '../blocks/filter-manager/FilterManager';
import { DataBlockModel } from './DataBlockModel';

export interface ResourceSettingsInitParams {
  dataSourceKey: string;
  collectionName: string;
  associationName?: string;
  sourceId?: string;
  filterByTk?: string;
}

export class CollectionBlockModel<T = DefaultStructure> extends DataBlockModel<T> {
  isManualRefresh = false;
  collectionRequired = true;
  private previousBeforeRenderHash; // qs 变化后为了防止区块依赖qs, 因此重跑beforeRender, task-1357
  private lastSeenDirtyVersion: number | null = null;
  private dirtyRefreshing = false;
  /**
   * 记录各筛选来源是否活跃（有有效筛选值）
   * key: filterId (筛选器 uid), value: boolean (是否有有效筛选)
   */
  private activeFilterSources: Map<string, boolean> = new Map();

  protected onMount() {
    super.onMount();
    this.previousBeforeRenderHash = this.context.location.search;
  }

  onActive() {
    if (!this.hidden && this.previousBeforeRenderHash !== this.context.location.search) {
      this.rerender();
      return;
    }

    if (this.hidden) return;
    if (this.isManualRefresh) return;

    const resource = this.context.resource as BaseRecordResource | undefined;
    if (!resource) return;

    const params = this.getResourceSettingsInitParams();
    const dataSourceKey = resource.getDataSourceKey() || params.dataSourceKey || 'main';
    const resourceName = resource.getResourceName() || params.associationName || params.collectionName;

    const engine = this.context.engine as FlowEngine;
    const currentVersion = engine.getDataSourceDirtyVersion(dataSourceKey, resourceName);

    const shouldRefresh = this.lastSeenDirtyVersion === null || currentVersion !== this.lastSeenDirtyVersion;
    if (!shouldRefresh) return;

    // Avoid firing multiple refreshes during rapid activate toggles.
    if (this.dirtyRefreshing) return;
    this.dirtyRefreshing = true;
    void resource
      .refresh()
      .then(() => {
        this.lastSeenDirtyVersion = currentVersion;
      })
      .catch(() => {
        // keep lastSeenDirtyVersion unchanged so next activate can retry
      })
      .finally(() => {
        this.dirtyRefreshing = false;
      });
  }

  /**
   * 子菜单过滤函数
   */
  static filterCollection(_collection: Collection) {
    if (_collection.filterTargetKey) {
      return true;
    }
    return false;
  }

  /**
   * 定义子菜单选项
   */
  static async defineChildren(ctx: FlowModelContext) {
    const createModelOptions = (options) => {
      if (!this.meta?.createModelOptions) {
        return options || {};
      }
      if (typeof this.meta.createModelOptions === 'function') {
        const defaults = this.meta.createModelOptions(ctx);
        return _.merge({}, defaults, options);
      }
      return _.merge({}, this.meta.createModelOptions, options);
    };
    const genKey = (key) => {
      return this.name + key;
    };
    const { dataSourceKey, collectionName, associationName, filterByTk } = ctx.view.inputArgs;
    const dataSources = ctx.dataSourceManager
      .getDataSources()
      .map((dataSource) => {
        if (dataSource.getCollections().length === 0) {
          return null;
        }
        return {
          key: genKey(`ds-${dataSource.key}`),
          label: dataSource.displayName,
          searchable: true,
          searchPlaceholder: tExpr('Search'),
          children: (ctx) => {
            return dataSource
              .getCollections()
              .map((collection) => {
                if (!this.filterCollection(collection)) {
                  return null;
                }
                const initOptions = {
                  dataSourceKey: collection.dataSourceKey,
                  collectionName: collection.name,
                };
                return {
                  key: genKey(`ds-${dataSource.key}.${collection.name}`),
                  label: collection.title,
                  useModel: this.name,
                  createModelOptions: createModelOptions({
                    stepParams: {
                      resourceSettings: {
                        init: initOptions,
                      },
                    },
                  }),
                };
              })
              .filter(Boolean);
          },
        };
      })
      .filter(Boolean);
    const children = (ctx) => {
      if (dataSources.length === 1) {
        return dataSources[0].children(ctx);
      }
      return dataSources;
    };
    if (!collectionName) {
      return children(ctx);
    }
    if (this._isScene('select')) {
      const initOptions = {
        dataSourceKey,
        collectionName,
        // filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      };
      if (associationName) {
        initOptions['associationName'] = associationName;
        initOptions['sourceId'] = '{{ctx.view.inputArgs.sourceId}}';
      }
      return [
        {
          key: genKey('current-collection'),
          label: 'Current collection',
          useModel: this.name,
          createModelOptions: createModelOptions({
            stepParams: {
              resourceSettings: {
                init: initOptions,
              },
            },
          }),
        },
        {
          key: genKey('others-collections'),
          label: 'Other collections',
          children: children(ctx),
        },
      ];
    }
    if (this._isScene('new')) {
      const initOptions = {
        dataSourceKey,
        collectionName,
        // filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      };
      if (associationName) {
        initOptions['associationName'] = associationName;
        initOptions['sourceId'] = '{{ctx.view.inputArgs.sourceId}}';
      }
      const items: any[] = [
        {
          key: genKey('current-collection'),
          label: 'Current collection',
          useModel: this.name,
          createModelOptions: createModelOptions({
            stepParams: {
              resourceSettings: {
                init: initOptions,
              },
            },
          }),
        },
      ];

      // 新建记录的弹窗（如 Add new）没有 record 锚点（filterByTk），此时不应允许添加「关联记录」区块。
      // 仅当弹窗携带 filterByTk（例如 View/Details 等记录态弹窗）时，才开放关联记录入口。
      if (typeof filterByTk !== 'undefined' && filterByTk !== null) {
        items.push({
          key: genKey('associated'),
          label: 'Associated records',
          children: () => {
            const collection = ctx.dataSourceManager.getCollection(dataSourceKey, collectionName);
            return collection
              .getAssociationFields(this._getScene())
              .map((field) => {
                if (!field.targetCollection) {
                  return null;
                }
                if (!this.filterCollection(field.targetCollection)) {
                  return null;
                }
                let sourceId = `{{ctx.popup.record.${field.sourceKey || field.collection.filterTargetKey}}}`;
                if (field.sourceKey === field.collection.filterTargetKey) {
                  sourceId = '{{ctx.view.inputArgs.filterByTk}}'; // 此时可以直接通过弹窗url读取，减少后端解析
                }
                const initOptions = {
                  dataSourceKey,
                  collectionName: field.target,
                  associationName: field.resourceName,
                  sourceId,
                };
                return {
                  key: genKey(`associated-${field.name}`),
                  label: field.title,
                  useModel: this.name,
                  createModelOptions: createModelOptions({
                    stepParams: {
                      resourceSettings: {
                        init: initOptions,
                      },
                    },
                  }),
                };
              })
              .filter(Boolean);
          },
        });
      }

      items.push({
        key: genKey('others-collections'),
        label: 'Other collections',
        children: children(ctx),
      });

      return items;
    }
    const items = [
      {
        key: genKey('associated'),
        label: 'Associated records',
        children: () => {
          const collection = ctx.dataSourceManager.getCollection(dataSourceKey, collectionName);
          return collection
            .getAssociationFields(this._getScene())
            .map((field) => {
              if (!field.targetCollection) {
                return null;
              }
              if (!this.filterCollection(field.targetCollection)) {
                return null;
              }
              let sourceId = `{{ctx.popup.record.${field.sourceKey || field.collection.filterTargetKey}}}`;
              if (field.sourceKey === field.collection.filterTargetKey) {
                sourceId = '{{ctx.view.inputArgs.filterByTk}}'; // 此时可以直接通过弹窗url读取，减少后端解析
              }
              const initOptions = {
                dataSourceKey,
                collectionName: field.target,
                associationName: field.resourceName,
                sourceId,
              };
              return {
                key: genKey(`associated-${field.name}`),
                label: field.title,
                useModel: this.name,
                createModelOptions: createModelOptions({
                  stepParams: {
                    resourceSettings: {
                      init: initOptions,
                    },
                  },
                }),
              };
            })
            .filter(Boolean);
        },
      },
      {
        key: genKey('others-records'),
        label: 'Other records',
        children: children(ctx),
      },
    ];
    if (this._isScene('one')) {
      const currentCollection = ctx.dataSourceManager.getCollection(dataSourceKey, collectionName);
      if (!currentCollection || !this.filterCollection(currentCollection)) {
        return items;
      }
      const initOptions = {
        dataSourceKey,
        collectionName,
        filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      };
      if (associationName) {
        initOptions['associationName'] = associationName;
        initOptions['sourceId'] = '{{ctx.view.inputArgs.sourceId}}';
      }
      items.unshift({
        key: genKey('current-record'),
        label: 'Current record',
        useModel: this.name,
        createModelOptions: createModelOptions({
          stepParams: {
            resourceSettings: {
              init: initOptions,
            },
          },
        }),
      } as any);
    }
    return items;
  }

  get dataSource(): DataSource {
    return this.context.dataSource;
  }

  get collection(): Collection {
    return this.context.collection;
  }

  get resource(): BaseRecordResource {
    return this.context.resource;
  }

  get association(): CollectionField | undefined {
    return this.context.association;
  }

  get associationField(): CollectionField | undefined {
    return this.context.association;
  }

  getAclActionName() {
    return 'view';
  }
  /**
   * 获取可用于筛选的字段列表
   */
  async getFilterFields(): Promise<
    {
      name: string;
      title: string;
      type: string;
      interface: string;
      getFirstSubclassNameOf: (baseClass: string) => string;
      target?: string;
      filterable?: {
        operators: {
          label: string;
          value: string;
        }[];
      };
    }[]
  > {
    return this.collection.getFields().filter((field) => field.filterable);
  }

  getResourceSettingsInitParams(): ResourceSettingsInitParams {
    return this.getStepParams('resourceSettings', 'init');
  }

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('blockModel', {
      value: this,
    });
    this.context.defineProperty('actionName', {
      get: () => this.getAclActionName(),
      cache: false,
    });
    this.context.defineProperty('resourceName', {
      get: () => this.resource.getResourceName(),
      cache: false,
    });
    this.context.defineProperty('dataSource', {
      get: () => {
        const params = this.getResourceSettingsInitParams();
        return this.context.dataSourceManager.getDataSource(params.dataSourceKey);
      },
    });
    this.context.defineProperty('collection', {
      get: () => {
        const params = this.getResourceSettingsInitParams();
        return this.context.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
      },
    });
    this.context.defineProperty('resource', {
      get: () => {
        const params = this.getResourceSettingsInitParams();
        const resource = this.createResource(this.context, params);
        // resource.setAPIClient(this.context.api);
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.associationName || params.collectionName);

        const syncDirtyVersion = () => {
          const engine = this.context.engine as FlowEngine | undefined;
          if (!engine?.getDataSourceDirtyVersion) return;
          const dataSourceKey = resource.getDataSourceKey?.() || params.dataSourceKey || 'main';
          const resourceName = resource.getResourceName?.() || params.associationName || params.collectionName;
          if (!resourceName) return;
          this.lastSeenDirtyVersion = engine.getDataSourceDirtyVersion(dataSourceKey, resourceName);
        };

        syncDirtyVersion();
        resource.on('refresh', () => {
          syncDirtyVersion();
          this.invalidateFlowCache('beforeRender');
        });
        return resource;
      },
    });
    this.context.defineProperty('association', {
      get: () => {
        const params = this.getResourceSettingsInitParams();
        if (!params.associationName) {
          return undefined;
        }
        return this.dataSource.getAssociation(params.associationName);
      },
    });
  }

  /**
   * 获取数据加载模式
   * @returns 'auto' | 'manual'
   */
  getDataLoadingMode(): 'auto' | 'manual' {
    return this.getStepParams('dataLoadingModeSettings')?.mode || 'auto';
  }

  /**
   * 设置指定筛选来源的活跃状态
   * @param filterId 筛选器 uid
   * @param active 是否有有效筛选值
   */
  setFilterActive(filterId: string, active: boolean) {
    this.activeFilterSources.set(filterId, active);
  }

  /**
   * 检查是否有任何活跃的筛选来源
   * @returns boolean
   */
  hasActiveFilters(): boolean {
    // 检查 dataScope 是否有筛选
    const resource = this.resource as MultiRecordResource;
    if (resource && resource['filter'] && Object.keys(resource['filter']).length > 0) {
      return true;
    }

    // 检查所有绑定的筛选器
    for (const [, active] of this.activeFilterSources) {
      if (active) {
        return true;
      }
    }

    return false;
  }

  /**
   * 移除指定筛选来源
   * @param filterId 筛选器 uid
   */
  removeFilterSource(filterId: string) {
    this.activeFilterSources.delete(filterId);
  }

  createResource(ctx, params): SingleRecordResource | MultiRecordResource {
    throw new Error('createResource method must be implemented in subclasses of CollectionBlockModel');
  }

  refresh() {
    if (!this.resource) {
      return super.refresh();
    }
    return this.resource.refresh();
  }

  protected defaultBlockTitle() {
    const blockLabel = this.translate(this.constructor['meta']?.label || this.constructor.name);
    const dsName = this.dataSource?.displayName || this.dataSource?.key;
    const dsCount = this.context?.dataSourceManager?.getDataSources?.().length || 0;
    const colTitle = this.collection?.title;
    if (this.association) {
      const resourceName = this.resource.getResourceName();
      const sourceCollection = this.dataSource.getCollection(resourceName.split('.')[0]);
      return createDefaultCollectionBlockTitle({
        blockLabel,
        dsName,
        dsCount,
        collectionTitle: colTitle,
        sourceCollectionTitle: sourceCollection.title,
        associationTitle: this.association.title,
      });
    }
    return createDefaultCollectionBlockTitle({ blockLabel, dsName, dsCount, collectionTitle: colTitle });
  }

  addAppends(fieldPath: string, refresh = false) {
    if (!fieldPath) {
      return;
    }
    if (fieldPath.includes('.')) {
      // 关系数据
      const [field1, field2] = fieldPath.split('.');
      const associationField = this.context.dataSourceManager.getCollectionField(
        `${this.collection.dataSourceKey}.${this.collection.name}.${field1}`,
      ) as CollectionField;
      if (!associationField) {
        return;
      }
      const targetCollectionName = associationField.target;

      if (!targetCollectionName) {
        return;
      }

      const collectionField = this.context.dataSourceManager.getCollectionField(
        `${this.collection.dataSourceKey}.${targetCollectionName}.${field2}`,
      ) as CollectionField;

      if (collectionField && collectionField.isAssociationField()) {
        (this.resource as BaseRecordResource).addAppends(fieldPath);
        if (collectionField.targetCollection?.template === 'tree') {
          const result = fieldPath.includes('.') ? fieldPath.slice(fieldPath.lastIndexOf('.') + 1) : fieldPath;
          if (collectionField.name === result) {
            (this.resource as BaseRecordResource).addAppends(`${fieldPath}.parent` + '(recursively=true)');
          }
        }
        if (refresh) {
          this.resource.refresh();
        }
      }
    } else {
      if (!this.collection) {
        return;
      }
      const field = this.context.dataSourceManager.getCollectionField(
        `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
      ) as CollectionField;
      if (!field) {
        return;
      }
      if (field.isAssociationField()) {
        (this.resource as BaseRecordResource).addAppends(field.name);
        if (field.targetCollection?.template === 'tree') {
          (this.resource as BaseRecordResource).addAppends(`${field.name}.parent` + '(recursively=true)');
        }
        if (refresh) {
          this.resource.refresh();
        }
      }
    }
  }
}

CollectionBlockModel.registerFlow({
  key: 'resourceSettings',
  sort: -999, //置顶，
  steps: {
    collectionCheck: {
      handler(ctx) {
        if (!ctx.collection) {
          ctx.exitAll();
        }
      },
    },
    aclCheck: {
      use: 'aclCheck',
    },
    init: {
      handler(ctx, params) {
        if (!params.dataSourceKey) {
          throw new Error('dataSourceKey is required');
        }
        if (!params.collectionName) {
          throw new Error('collectionName is required');
        }
        // sourceId 为运行时参数，必须放在 runtime context 中
        if (Object.keys(params).includes('sourceId')) {
          // TODO: 这里的 replace 都是为了兼容老数据，发布版本前删除掉（或者下次大的不兼容变更时删除）
          ctx.resource.setSourceId(params.sourceId);
        }
        // filterByTk 为运行时参数，必须放在 runtime context 中
        if (Object.keys(params).includes('filterByTk')) {
          // TODO: 这里的 replace 都是为了兼容老数据，发布版本前删除掉（或者下次大的不兼容变更时删除）
          ctx.resource.setFilterByTk(params.filterByTk);
        }
      },
    },
  },
});

CollectionBlockModel.registerFlow({
  key: 'refreshSettings',
  sort: 10000,
  steps: {
    refresh: {
      async handler(ctx) {
        const blockModel = ctx.model as CollectionBlockModel;
        const filterManager: FilterManager = ctx.model.context.filterManager;
        if (filterManager) {
          filterManager.bindToTarget(ctx.model.uid);
        }

        // 检查数据加载模式
        const loadingMode = blockModel.getDataLoadingMode();
        const resource = blockModel.resource;
        const isMultiResource = resource instanceof MultiRecordResource;

        if (isMultiResource && loadingMode === 'manual' && !blockModel.hasActiveFilters()) {
          // manual 模式且无活跃筛选时，清空数据且不加载
          resource.setData([]);
          resource.setMeta({ count: 0, hasNext: false, page: 1 });
          resource.loading = false;
          return;
        }

        if (ctx.model.isManualRefresh) {
          ctx.model.resource.loading = false;
        } else {
          await ctx.model.resource.refresh();
        }
      },
    },
  },
});

CollectionBlockModel.registerFlow({
  key: 'dataLoadingModeSettings',
  sort: 800,
  title: tExpr('Set data loading mode'),
  steps: {
    dataLoadingMode: {
      use: 'dataLoadingMode',
    },
  },
});

CollectionBlockModel.define({ hide: true });
