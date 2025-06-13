/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, Input } from '@formily/antd-v5';
import { Field, Form } from '@formily/core';
import { FieldContext } from '@formily/react';
import { CollectionField, FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { ReactiveField } from '../Formily/ReactiveField';

export class FormItemModel extends FlowModel {
  collectionField: CollectionField;
  field: Field;

  get form() {
    return this.parent.form as Form;
  }

  setTitle(title: string) {
    this.field.title = title || this.collectionField.title;
  }

  setRequired(required: boolean) {
    this.field.required = required;
  }

  setInitialValue(initialValue: any) {
    this.field.initialValue = initialValue;
  }

  createField() {
    return this.form.createField({
      name: this.collectionField.name,
      ...this.props,
      decorator: [
        FormItem,
        {
          title: this.props.title,
        },
      ],
      component: [Input, {}],
    });
  }

  render() {
    return (
      <FieldContext.Provider value={this.field}>
        <ReactiveField field={this.field}>{this.props.children}</ReactiveField>
      </FieldContext.Provider>
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
        const collectionField = ctx.globals.dataSourceManager.getCollectionField(params.fieldPath);
        ctx.model.collectionField = collectionField;
        ctx.model.field = ctx.model.createField();
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
        ctx.model.setTitle(params.title);
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
        ctx.model.setInitialValue(params.defaultValue);
      },
    },
  },
});

export class CommonFormItemFlowModel extends FormItemModel {}

FormItemModel.registerFlow({
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
        ctx.model.setRequired(params.required || false);
      },
    },
  },
});
