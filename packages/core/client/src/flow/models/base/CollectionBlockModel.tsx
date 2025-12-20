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

  onActive() {
    if (!this.hidden) {
      this.resource?.refresh();
    }
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
    const { dataSourceKey, collectionName, associationName } = ctx.view.inputArgs;
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
    if (this._isScene('new') || this._isScene('select')) {
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
        resource.on('refresh', () => {
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

  createResource(ctx, params): SingleRecordResource | MultiRecordResource {
    throw new Error('createResource method must be implemented in subclasses of CollectionBlockModel');
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
          (this.resource as BaseRecordResource).addAppends(`${fieldPath}.parent` + '(recursively=true)');
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
        const filterManager: FilterManager = ctx.model.context.filterManager;
        if (filterManager) {
          filterManager.bindToTarget(ctx.model.uid);
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

CollectionBlockModel.define({ hide: true });
