/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import { BaseItem } from '@formily/antd-v5';
import React from 'react';
import { castArray } from 'lodash';
import { FieldModel } from '../../base/FieldModel';

export class DetailItemModel extends FieldModel {
  decoratorProps;
  setDecoratorProps(props) {
    this.decoratorProps = { ...this.decoratorProps, ...props };
  }
  render() {
    const resource = (this.parent as any).resource;
    const fieldModel = this.subModels.field as any;
    const values = castArray(resource.getData()).filter(Boolean);
    const value = values[0] ? values[0][this.fieldPath] : null;
    fieldModel.setSharedContext({
      ...this.ctx.shared,
      value,
    });
    return (
      <BaseItem {...this.decoratorProps} label={this.collectionField.title}>
        {fieldModel.render()}
      </BaseItem>
    );
  }
}

DetailItemModel.define({
  title: tval('Detail Item'),
  icon: 'DetailFormItem',
  defaultOptions: {
    use: 'DetailItemModel',
  },
  sort: 100,
});

DetailItemModel.registerFlow({
  key: 'detailFieldDefault',
  auto: true,
  sort: 300,
  steps: {
    editTitle: {
      title: tval('Edit Title'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: tval('Enter field title'),
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setTitle(params.title);
      },
      defaultParams: (ctx) => {
        return {
          title: ctx.model.collectionField?.title,
        };
      },
    },
    displayLabel: {
      title: tval('Display label'),
      uiSchema: {
        displayLabel: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: tval('Yes'),
            unCheckedChildren: tval('No'),
          },
        },
      },
      defaultParams: {
        displayLabel: true,
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ displayLabel: params.displayLabel === undefined ? true : params.displayLabel });
      },
    },
    editDescription: {
      title: tval('Edit description'),
      uiSchema: {
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ description: params.description });
      },
    },
    editTooltip: {
      title: tval('Edit tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ tooltip: params.tooltip });
      },
    },
  },
});
