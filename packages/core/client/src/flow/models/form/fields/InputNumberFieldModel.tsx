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
import { InputNumber } from 'antd';

export class InputNumberFieldModel extends FormItemModel {
  render() {
    return (
      <div>
        <FormilyField
          name={this.field.name}
          title={this.field.title}
          required
          decorator={[FormItem]}
          component={[
            InputNumber,
            {
              style: {
                width: '100%',
              },
              ...this.props,
            },
          ]}
        />
      </div>
    );
  }
}

InputNumberFieldModel.registerFlow({
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
