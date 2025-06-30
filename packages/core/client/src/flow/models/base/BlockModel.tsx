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

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {}

export const HeightMode = {
  DEFAULT: 'defaultHeight',
  SPECIFY_VALUE: 'specifyValue',
  FULL_HEIGHT: 'fullHeight',
};
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
        ctx.model.setProps('title', title);
        ctx.model.setProps('description', description);
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
        ctx.model.setProps('heightMode', params.heightMode);
        ctx.model.setProps('height', params.height);
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
