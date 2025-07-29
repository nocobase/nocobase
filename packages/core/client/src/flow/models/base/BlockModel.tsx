/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Schema } from '@formily/json-schema';
import { observable } from '@formily/reactive';
import { Observer } from '@formily/reactive-react';
import {
  BaseRecordResource,
  Collection,
  CollectionField,
  DataSource,
  DefaultStructure,
  escapeT,
  FlowModel,
  MultiRecordResource,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import React from 'react';
import { BlockItemCard } from '../common/BlockItemCard';

export interface ResourceSettingsInitParams {
  dataSourceKey: string;
  collectionName: string;
  associationName?: string;
  sourceId?: string;
  filterByTk?: string;
}

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {
  decoratorProps: Record<string, any> = observable({});

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
    return `${this.translate(this.constructor['meta']?.title || this.constructor.name)}`;
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

BlockModel.define({ hide: true });

export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {}

export class CollectionBlockModel<T = DefaultStructure> extends DataBlockModel<T> {
  isManualRefresh = false;

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

  getResourceSettingsInitParams(): ResourceSettingsInitParams {
    return this.getStepParams('resourceSettings', 'init');
  }

  onInit(options) {
    this.context.defineProperty('blockModel', {
      value: this,
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
        return this.dataSource.getAssocation(params.associationName);
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
    ${this.translate(this.constructor['meta']?.title || this.constructor.name)}:
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
  steps: {
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
          ctx.resource.setSourceId(
            Schema.compile(params.sourceId.replace('shared.currentFlow.', '').replace('.runtimeArgs.', '.inputArgs.'), {
              ctx: ctx.currentFlow,
            }),
          );
        }
        // filterByTk 为运行时参数，必须放在 runtime context 中
        if (Object.keys(params).includes('filterByTk')) {
          // TODO: 这里的 replace 都是为了兼容老数据，发布版本前删除掉（或者下次大的不兼容变更时删除）
          ctx.resource.setFilterByTk(
            Schema.compile(
              params.filterByTk?.replace('shared.currentFlow.', '').replace('.runtimeArgs.', '.inputArgs.'),
              { ctx: ctx.currentFlow },
            ),
          );
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

FilterBlockModel.define({ hide: true });
