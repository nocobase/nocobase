import { FormButtonGroup, FormDialog, FormItem, Input, Submit } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { createSchemaField, Field as FormilyField, FormProvider } from '@formily/react';
import { Field, FlowModel } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

export class FormItemModel extends FlowModel {
  field: Field;

  render() {
    return (
      <div>
        <FormilyField
          name="input"
          title="input box"
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
      handler(ctx, params) {},
    },
  },
});
