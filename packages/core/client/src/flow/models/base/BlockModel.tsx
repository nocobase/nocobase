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
  APIResource,
  BaseRecordResource,
  Collection,
  CollectionField,
  DefaultStructure,
  escapeT,
  FlowModel,
  MultiRecordResource,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { BlockItemCard } from '../common/BlockItemCard';

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {
  decoratorProps: Record<string, any> = observable({});
  setDecoratorProps(props) {
    Object.assign(this.decoratorProps, props);
  }

  renderComponent() {
    throw new Error('renderComponent method must be implemented in subclasses of BlockModel');
    return null;
  }

  render() {
    return (
      <BlockItemCard {...this.decoratorProps}>
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
  auto: true,
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

export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {
  resource: BaseRecordResource;
  associationField?: CollectionField;
  collection: Collection;

  onInit(options) {
    this.setSharedContext({
      currentBlockModel: this,
    });
  }

  createResource(ctx, params): SingleRecordResource | MultiRecordResource {
    throw new Error('createResource method must be implemented in subclasses of DataBlockModel');
    return new MultiRecordResource();
  }

  get title() {
    return this.translate(this._title) || this.defaultBlockTitle();
  }

  protected defaultBlockTitle() {
    let collectionTitle = this.collection?.title;
    if (this.associationField) {
      const resourceName = this.resource.getResourceName();
      const sourceCollection = this.collection.dataSource.getCollection(resourceName.split('.')[0]);
      collectionTitle = [sourceCollection.title, this.associationField.title].join(' > ');
      collectionTitle += ` (${this.collection?.title})`;
    }
    return `
    ${this.translate(this.constructor['meta']?.title || this.constructor.name)}:
    ${collectionTitle}`;
  }

  addAppends(fieldPath: string, refresh = false) {
    const field = this.ctx.dataSourceManager.getCollectionField(
      `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
    );
    if (!field) {
      return;
    }
    if (['belongsToMany', 'belongsTo', 'hasMany', 'hasOne', 'belongsToArray'].includes(field.type)) {
      (this.resource as BaseRecordResource).addAppends(field.name);
      if (refresh) {
        this.resource.refresh();
      }
    }
  }
}

DataBlockModel.registerFlow({
  key: 'resourceSettings',
  auto: true,
  steps: {
    init: {
      handler(ctx, params) {
        if (!params.dataSourceKey) {
          throw new Error('dataSourceKey is required');
        }
        if (!params.collectionName) {
          throw new Error('collectionName is required');
        }
        if (!ctx.model.collection) {
          ctx.model.collection = ctx.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
        }
        if (!ctx.model.resource) {
          if (params.associationName) {
            const [cName, fName] = params.associationName.split('.');
            const sourceCollection = ctx.dataSourceManager.getCollection(params.dataSourceKey, cName);
            ctx.model.associationField = sourceCollection.getField(fName);
          }
          ctx.model.resource = ctx.model.createResource(ctx, params);
          ctx.model.resource.setAPIClient(ctx.api);
          ctx.model.resource.setDataSourceKey(params.dataSourceKey);
          ctx.model.resource.setResourceName(params.associationName || params.collectionName);
          ctx.model.resource.on('refresh', () => {
            ctx.model.invalidateAutoFlowCache();
          });
        }
        if (Object.keys(params).includes('sourceId')) {
          ctx.model.resource.setSourceId(
            Schema.compile(params.sourceId.replace('shared.currentFlow.', ''), { ctx: ctx.shared.currentFlow }),
          );
        }
        if (Object.keys(params).includes('filterByTk')) {
          ctx.model.resource.setFilterByTk(
            Schema.compile(params.filterByTk.replace('shared.currentFlow.', ''), { ctx: ctx.shared.currentFlow }),
          );
        }
        ctx.logger.info('params', params);
      },
    },
  },
});

DataBlockModel.define({ hide: true });

export class FilterBlockModel<T = DefaultStructure> extends BlockModel<T> {}

FilterBlockModel.define({ hide: true });
