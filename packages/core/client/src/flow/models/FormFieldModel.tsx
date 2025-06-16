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

type FieldComponentTuple = [component: React.ElementType, props: Record<string, any>] | any[];

export class FormFieldModel extends FlowModel {
  collectionField: CollectionField;
  field: Field;

  get form() {
    return this.parent.form as Form;
  }

  get decorator() {
    return [FormItem, {}];
  }

  get component(): FieldComponentTuple {
    return [Input, {}];
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

  setComponentProps(componentProps) {
    this.field.setComponentProps(componentProps);
  }

  getComponentProps() {
    return this.field.componentProps;
  }

  setDecoratorProps(decoratorProps) {
    this.field.setDecoratorProps(decoratorProps);
  }

  getDecoratorProps() {
    return this.field.decoratorProps;
  }

  setDataSource(dataSource: any[]) {
    this.field.dataSource = dataSource;
  }

  createField() {
    return this.form.createField({
      name: this.collectionField.name,
      ...this.props,
      decorator: this.decorator,
      component: this.component,
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

FormFieldModel.registerFlow({
  key: 'default',
  auto: true,
  title: 'Basic',
  steps: {
    step1: {
      handler(ctx, params) {
        const collectionField = ctx.globals.dataSourceManager.getCollectionField(params.fieldPath) as CollectionField;
        ctx.model.collectionField = collectionField;
        ctx.model.field = ctx.model.createField();
        ctx.model.setComponentProps(collectionField.getComponentProps());
        if (collectionField.enum.length) {
          ctx.model.setDataSource(collectionField.enum);
        }
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

FormFieldModel.registerFlow({
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

export class CommonFormItemFlowModel extends FormFieldModel {
  public static readonly supportedFieldInterfaces = '*';
}

// FormFieldModel.registerFlow({
//   key: 'key2',
//   auto: true,
//   title: 'Group2',
//   steps: {

//   },
// });
