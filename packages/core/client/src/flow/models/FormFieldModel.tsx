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
import type { FieldValidator, FieldPatternTypes } from '@formily/core';
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

  setDataSource(dataSource: any[]) {
    this.field.dataSource = dataSource;
  }

  setValidator(validator: FieldValidator) {
    this.field.validator = validator;
  }
  setDecoratorProps(decoratorProps) {
    this.field.setDecoratorProps(decoratorProps);
  }

  getDecoratorProps() {
    return this.field.decoratorProps;
  }
  setDisplayLabel(displayLabel: boolean) {
    this.field.setDecoratorProps({
      labelStyle: { display: displayLabel ? 'flex' : 'none' },
    });
  }
  setDescription(description: string) {
    this.field.description = description;
  }
  setPattern(pattern: FieldPatternTypes) {
    this.field.pattern = pattern;
  }
  setTooltip(tooltip: string) {
    this.field.setDecoratorProps({
      tooltip: tooltip,
    });
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
        const validator = collectionField.options.uiSchema?.['x-validator'];
        if (validator) {
          ctx.model.setValidator(validator);
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
      defaultParams: (ctx) => {
        return {
          title: ctx.model.collectionField?.title,
        };
      },
    },
    initialValue: {
      title: 'Set default value',
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
    displayLabel: {
      title: 'Display label',
      uiSchema: {
        displayLabel: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: 'Yes',
            unCheckedChildren: 'No',
          },
        },
      },
      defaultParams: {
        displayLabel: true,
      },
      handler(ctx, params) {
        ctx.model.setDisplayLabel(params.displayLabel === undefined ? true : params.displayLabel);
      },
    },
    editDescription: {
      title: 'Edit description',
      uiSchema: {
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setDescription(params.description);
      },
    },
    editTooltip: {
      title: 'Edit tooltip',
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setTooltip(params.tooltip);
      },
    },
    pattern: {
      title: 'Pattern',
      uiSchema: {
        pattern: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
            {
              value: 'editable',
              label: 'Editable',
            },
            {
              value: 'disabled',
              label: 'Disabled',
            },
            {
              value: 'readOnly',
              label: 'ReadOnly',
            },
            {
              value: 'readPretty',
              label: 'ReadPretty',
            },
          ],
        },
      },
      defaultParams: (ctx) => ({
        pattern: ctx.model.field?.pattern || 'editable',
      }),
      handler(ctx, params) {
        ctx.model.setPattern(params.pattern);
      },
    },
  },
});

export class CommonFormItemFlowModel extends FormFieldModel {
  public static readonly supportedFieldInterfaces = '*';
}
