/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, Input } from '@formily/antd-v5';
import { Field as FormilyField } from '@formily/react';
import { Field, FlowModel } from '@nocobase/flow-engine';
import React from 'react';

export class FormItemModel extends FlowModel {
  field: Field;

  render() {
    return (
      <div>
        <FormilyField
          name={this.field.name}
          title={this.field.title}
          required
          decorator={[FormItem]}
          component={[
            Input,
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

FormItemModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx, params) {
        const field = ctx.globals.dataSourceManager.getCollectionField(params.fieldPath);
        const { uiSchema } = field.options;
        ctx.model.setProps({ ...uiSchema?.['x-component-props'] });
        ctx.model.field = field;
      },
    },
  },
});

export class CommonFormItemFlowModel extends FormItemModel {}
