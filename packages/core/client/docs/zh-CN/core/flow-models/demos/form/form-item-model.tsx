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
                width: 240,
              },
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
        const field = ctx.globals.dsm.getCollectionField(params.fieldPath);
        ctx.model.field = field;
      },
    },
  },
});
