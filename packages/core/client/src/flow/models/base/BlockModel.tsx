/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { tval } from '@nocobase/utils/client';
import { APIResource, BaseRecordResource, Collection, DefaultStructure, FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { BlockItemCard } from '../common/BlockItemCard';
import { observable } from '@formily/reactive';
import { Observer } from '@formily/reactive-react';

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
  key: 'blockProps',
  title: tval('Basic configuration'),
  auto: true,
  steps: {
    editBlockTitleAndDescription: {
      title: tval('Edit block title & description'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          title: tval('Title'),
        },
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          title: tval('Description'),
        },
      },
      handler(ctx, params) {
        const title = ctx.globals.flowEngine.translate(params.title);
        const description = ctx.globals.flowEngine.translate(params.description);
        ctx.model.setDecoratorProps({ title: title, description: description });
      },
    },
    setBlockHeight: {
      title: tval('Set block height'),
      uiSchema: {
        heightMode: {
          type: 'string',
          enum: [
            { label: tval('Default'), value: HeightMode.DEFAULT },
            { label: tval('Specify height'), value: HeightMode.SPECIFY_VALUE },
            { label: tval('Full height'), value: HeightMode.FULL_HEIGHT },
          ],
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
        height: {
          title: tval('Height'),
          type: 'string',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'NumberPicker',
          'x-component-props': {
            addonAfter: 'px',
          },
          'x-validator': [
            {
              minimum: 40,
            },
          ],
          'x-reactions': {
            dependencies: ['heightMode'],
            fulfill: {
              state: {
                hidden: '{{ $deps[0]==="fullHeight"||$deps[0]==="defaultHeight"}}',
                value: '{{$deps[0]!=="specifyValue"?null:$self.value}}',
              },
            },
          },
        },
      },
      defaultParams: () => {
        return {
          heightMode: HeightMode.DEFAULT,
        };
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ heightMode: params.heightMode, height: params.height });
      },
    },
  },
});
export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {
  resource: APIResource;
  collection: Collection;

  onInit(options) {
    this.setSharedContext({
      currentBlockModel: this,
    });
  }

  get title() {
    return (
      this.translate(this._title) ||
      `
    ${this.collection.title} > 
    ${this.collection.dataSource.displayName} > 
    ${this.translate(this.constructor['meta']?.title || this.constructor.name)}`
    );
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

export class FilterBlockModel<T = DefaultStructure> extends BlockModel<T> {}
