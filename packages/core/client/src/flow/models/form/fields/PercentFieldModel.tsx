/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@formily/antd-v5';
import { Field as FormilyField } from '@formily/react';
import { FormItemModel } from '../../form-item-model';
import React from 'react';
import { isNum } from '@formily/shared';
import { InputNumber } from 'antd';
import * as math from 'mathjs';

const isNumberLike = (index: any): index is number => isNum(index) || /^-?\d+(\.\d+)?$/.test(index);

const toValue = (value: any, callback: (v: number) => number) => {
  if (isNumberLike(value)) {
    return math.round(callback(value), 9);
  }
  return null;
};

export class PercentFieldModel extends FormItemModel {
  render() {
    return (
      <div>
        <FormilyField
          name={this.field.name}
          title={this.field.title}
          required={this.props.required}
          decorator={[FormItem]}
          component={[
            InputNumber,
            {
              style: {
                width: '100%',
              },
              ...this.props,
              addonAfter: '%',
            },
          ]}
        />
      </div>
    );
  }
}

PercentFieldModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx, params) {
        const field = ctx.globals.dataSourceManager.getCollectionField(params.fieldPath);
        const { uiSchema } = field.options;
        ctx.model.field = field;
        ctx.model.setProps({ ...uiSchema?.['x-component-props'] });
      },
    },
  },
});
