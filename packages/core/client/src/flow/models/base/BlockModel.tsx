/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { observable } from '@formily/reactive';
import { Observer } from '@formily/reactive-react';
import {
  BaseRecordResource,
  buildSubModelItems,
  Collection,
  CollectionField,
  createCollectionContextMeta,
  DataSource,
  DefaultStructure,
  escapeT,
  FlowModel,
  FlowModelContext,
  MultiRecordResource,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Result } from 'antd';
import _, { capitalize } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockItemCard } from '../common/BlockItemCard';
import { FilterManager } from '../filter-blocks/filter-manager/FilterManager';

export interface ResourceSettingsInitParams {
  dataSourceKey: string;
  collectionName: string;
  associationName?: string;
  sourceId?: string;
  filterByTk?: string;
}

export const CollectionNotAllowView = ({ actionName, collectionTitle }) => {
  const { t } = useTranslation();
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for collection "{{name}}"`,
      {
        actionName: t(capitalize(actionName)),
        name: collectionTitle,
      },
    ).replaceAll('&gt;', '>');
  }, [collectionTitle, actionName, t]);
  return (
    <BlockItemCard>
      <Result status="403" subTitle={messageValue} />
    </BlockItemCard>
  );
};

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {
  decoratorProps: Record<string, any> = observable({});

  // 设置态隐藏时的占位渲染
  protected renderHiddenInConfig(): React.ReactNode | undefined {
    return (
      <CollectionNotAllowView actionName={this.context.actionName} collectionTitle={(this as any).collection?.title} />
    );
  }

  setDecoratorProps(props) {
    Object.assign(this.decoratorProps, props);
  }

  get title() {
    if (!this._title) {
      this._title = this.defaultBlockTitle();
    }
    return this._title;
  }

  protected defaultBlockTitle() {
    return `${this.translate(this.constructor['meta']?.label || this.constructor.name)}`;
  }

  renderComponent(): any {
    throw new Error('renderComponent method must be implemented in subclasses of BlockModel');
  }

  render() {
    return (
      <BlockItemCard ref={this.context.ref} {...this.decoratorProps}>
        <Observer>
          {() => {
            return this.renderComponent();
          }}
        </Observer>
      </BlockItemCard>
    );
  }
}

BlockModel.registerFlow({
  key: 'cardSettings',
  title: escapeT('Card settings'),
  steps: {
    titleDescription: {
      title: escapeT('Title & description'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          title: escapeT('Title'),
        },
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          title: escapeT('Description'),
        },
      },
      handler(ctx, params) {
        const title = ctx.t(params.title);
        const description = ctx.t(params.description);
        ctx.model.setDecoratorProps({ title: title, description: description });
      },
    },
    // setBlockHeight: {
    //   title: tval('Set block height'),
    //   uiSchema: {
    //     heightMode: {
    //       type: 'string',
    //       enum: [
    //         { label: tval('Default'), value: HeightMode.DEFAULT },
    //         { label: tval('Specify height'), value: HeightMode.SPECIFY_VALUE },
    //         { label: tval('Full height'), value: HeightMode.FULL_HEIGHT },
    //       ],
    //       required: true,
    //       'x-decorator': 'FormItem',
    //       'x-component': 'Radio.Group',
    //     },
    //     height: {
    //       title: tval('Height'),
    //       type: 'string',
    //       required: true,
    //       'x-decorator': 'FormItem',
    //       'x-component': 'NumberPicker',
    //       'x-component-props': {
    //         addonAfter: 'px',
    //       },
    //       'x-validator': [
    //         {
    //           minimum: 40,
    //         },
    //       ],
    //       'x-reactions': {
    //         dependencies: ['heightMode'],
    //         fulfill: {
    //           state: {
    //             hidden: '{{ $deps[0]==="fullHeight"||$deps[0]==="defaultHeight"}}',
    //             value: '{{$deps[0]!=="specifyValue"?null:$self.value}}',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   defaultParams: () => {
    //     return {
    //       heightMode: HeightMode.DEFAULT,
    //     };
    //   },
    //   handler(ctx, params) {
    //     ctx.model.setDecoratorProps({ heightMode: params.heightMode, height: params.height });
    //   },
    // },
  },
});

BlockModel.define({ hide: true, label: escapeT('Other blocks') });

//

export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {
  static inTypes(type: string) {
    const types = this.getTypes();
    return types.includes(type);
  }

  static getTypes() {
    return _.castArray(this['types'] || this['type'] || []);
  }

  static async defineChildren(ctx: FlowModelContext) {
    const children = await buildSubModelItems(this)(ctx);
    const { collectionName, filterByTk } = ctx.view.inputArgs;
    return children.filter((item) => {
      if (collectionName && !filterByTk) {
        const M = ctx.engine.getModelClass(item.useModel);
        return M?.['inTypes']('toNew');
      }
      return true;
    });
  }
}

DataBlockModel.define({ hide: true, label: escapeT('Data blocks') });

export class CollectionBlockModel<T = DefaultStructure> extends DataBlockModel<T> {
  isManualRefresh = false;

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
    const dataSources = ctx.dataSourceManager.getDataSources().map((dataSource) => {
      return {
        key: genKey(`ds-${dataSource.key}`),
        label: dataSource.displayName,
        searchable: true,
        searchPlaceholder: 'Search blocks',
        children: (ctx) => {
          return dataSource.getCollections().map((collection) => {
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
          });
        },
      };
    });
    const children = (ctx) => {
      if (dataSources.length === 1) {
        return dataSources[0].children(ctx);
      }
      return dataSources;
    };
    if (!collectionName) {
      return children(ctx);
    }
    if (this.inTypes('toNew')) {
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
          return collection.getAssociationFields(this.getTypes()).map((field) => {
            const initOptions = {
              dataSourceKey,
              collectionName: field.target,
              associationName: field.resourceName,
              sourceId: '{{ctx.view.inputArgs.filterByTk}}',
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
          });
        },
      },
      {
        key: genKey('others-records'),
        label: 'Other records',
        children: children(ctx),
      },
    ];
    if (this.inTypes('toOne')) {
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

  async destroy(): Promise<boolean> {
    const result = await super.destroy();

    const filterManager: FilterManager = this.context.filterManager;
    await filterManager.removeFilterConfig({ targetId: this.uid });

    return result;
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
  async getFilterFields(): Promise<{ name: string; title: string; target?: string }[]> {
    return this.collection.getFields().filter((field) => field.filterable);
  }

  getResourceSettingsInitParams(): ResourceSettingsInitParams {
    return this.getStepParams('resourceSettings', 'init');
  }

  onInit(options) {
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
      meta: createCollectionContextMeta(() => {
        const params = this.getResourceSettingsInitParams();
        return this.context.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
      }, this.context.t('Current collection')),
    });
    this.context.defineProperty('resource', {
      get: () => {
        const params = this.getResourceSettingsInitParams();
        const resource = this.createResource(this.context, params);
        resource.setAPIClient(this.context.api);
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.associationName || params.collectionName);
        resource.on('refresh', () => {
          this.invalidateAutoFlowCache();
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
    let collectionTitle = this.collection?.title;
    if (this.association) {
      const resourceName = this.resource.getResourceName();
      const sourceCollection = this.dataSource.getCollection(resourceName.split('.')[0]);
      collectionTitle = [sourceCollection.title, this.association.title].join(' > ');
      collectionTitle += ` (${this.collection?.title})`;
    }
    return `
    ${this.translate(this.constructor['meta']?.label || this.constructor.name)}:
    ${collectionTitle}`;
  }

  addAppends(fieldPath: string, refresh = false) {
    if (fieldPath.includes('.')) {
      // 关系数据
      const [field1, field2] = fieldPath.split('.');
      const associationField = this.context.dataSourceManager.getCollectionField(
        `${this.collection.dataSourceKey}.${this.collection.name}.${field1}`,
      ) as CollectionField;
      const targetCollectionName = associationField.target;
      const collectionField = this.context.dataSourceManager.getCollectionField(
        `${this.collection.dataSourceKey}.${targetCollectionName}.${field2}`,
      ) as CollectionField;

      if (collectionField.isAssociationField()) {
        (this.resource as BaseRecordResource).addAppends(fieldPath);
        if (refresh) {
          this.resource.refresh();
        }
      }
    } else {
      const field = this.context.dataSourceManager.getCollectionField(
        `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
      ) as CollectionField;
      if (!field) {
        return;
      }
      if (field.isAssociationField()) {
        (this.resource as BaseRecordResource).addAppends(field.name);
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
        filterManager.bindToTarget(ctx.model.uid);
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

export class FilterBlockModel<T = DefaultStructure> extends BlockModel<T> {}

FilterBlockModel.define({ hide: true, label: 'Filter blocks' });
