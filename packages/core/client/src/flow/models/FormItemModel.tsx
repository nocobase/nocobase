/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, Input } from '@formily/antd-v5';
import { Form } from '@formily/core';
import { Field as FormilyField } from '@formily/react';
import { CollectionField, FlowModel } from '@nocobase/flow-engine';
import React from 'react';

export class FormItemModel extends FlowModel {
  field: CollectionField;

  clearGraph() {
    const form = this.parent.form as Form;
    form.clearFormGraph(this.field.name);
  }

  render() {
    return (
      <div>
        <FormilyField
          name={this.field.name}
          title={this.props.title || this.field.title}
          required={this.props.required}
          decorator={[FormItem]}
          component={[Input, {}]}
        />
      </div>
    );
  }
}

FormItemModel.registerFlow({
  key: 'default',
  auto: true,
  title: 'Basic',
  steps: {
    step1: {
      handler(ctx, params) {
        const field = ctx.globals.dataSourceManager.getCollectionField(params.fieldPath);
        ctx.model.field = field;
      },
    },
    editTitle: {
      title: 'Edit Title',
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: 'Enter field title',
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('title', params.title);
        ctx.model.clearGraph();
      },
    },
    initialValue: {
      title: 'Default value',
      uiSchema: {
        defaultValue: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {},
        },
      },
      handler(ctx, params) {
        const form = ctx.model.parent.form as Form;
        form.setInitialValuesIn(ctx.model.field.name, params.defaultValue);
      },
    },
  },
});

export class CommonFormItemFlowModel extends FormItemModel {}

CommonFormItemFlowModel.registerFlow({
  key: 'key2',
  auto: true,
  title: 'Group2',
  steps: {
    required: {
      title: 'Required',
      uiSchema: {
        required: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: 'Yes',
            unCheckedChildren: 'No',
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('required', params.required);
        ctx.model.clearGraph();
      },
    },
  },
});
