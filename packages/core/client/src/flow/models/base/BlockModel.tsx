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
  DefaultStructure,
  escapeT,
  FlowModel,
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
    editBlockTitleAndDescription: {
      title: escapeT('Edit block title & description'),
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
        const title = ctx.globals.flowEngine.translate(params.title);
        const description = ctx.globals.flowEngine.translate(params.description);
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
  resource: APIResource;
  collection: Collection;

  onInit(options) {
    this.setSharedContext({
      currentBlockModel: this,
    });
  }

  get title() {
    return this.translate(this._title) || this.defaultBlockTitle();
  }

  protected defaultBlockTitle() {
    let collectionTitle = this.collection.title;
    if (this.resource instanceof BaseRecordResource && this.resource.getSourceId()) {
      const resourceName = this.resource.getResourceName();
      const collectionNames = resourceName.split('.');
      const collections = collectionNames.map((name) => this.collection.dataSource.getCollection(name));
      collectionTitle = collections.map((collection) => `${collection.title}`).join(' > ');
    }
    return `
    ${this.translate(this.constructor['meta']?.title || this.constructor.name)}:
    ${collectionTitle}`;
  }

  addAppends(fieldPath: string, refresh = false) {
    const field = this.ctx.globals.dataSourceManager.getCollectionField(
      `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
    );
    if (!field) {
      return;
    }
    if (['belongsToMany', 'belongsTo', 'hasMany', 'hasOne'].includes(field.type)) {
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
        ctx.logger.info('params', params);
        ctx.model.setProps('dataSourceOptions', {
          dataSourceKey: params.dataSourceKey,
          collectionName: params.collectionName,
          associationName: params.associationName,
          sourceId: Schema.compile(params.sourceId, { ctx }),
          filterByTk: Schema.compile(params.filterByTk, { ctx }),
        });
      },
    },
  },
});

DataBlockModel.define({ hide: true });

export class FilterBlockModel<T = DefaultStructure> extends BlockModel<T> {}

FilterBlockModel.define({ hide: true });
