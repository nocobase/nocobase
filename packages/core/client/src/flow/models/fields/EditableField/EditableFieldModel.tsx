/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, Input } from '@formily/antd-v5';
import type { FieldPatternTypes, FieldValidator } from '@formily/core';
import { Field, Form } from '@formily/core';
import { FieldContext } from '@formily/react';
import React from 'react';
import { tval } from '@nocobase/utils/client';
import { FieldModel } from '../../base/FieldModel';
import { ReactiveField } from '../../../formily/ReactiveField';
import { FormModel } from '../..';

type FieldComponentTuple = [component: React.ElementType, props: Record<string, any>] | any[];

type Structure = {
  parent: FormModel;
};

export class EditableFieldModel extends FieldModel<Structure> {
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

EditableFieldModel.registerFlow({
  key: 'init',
  auto: true,
  title: tval('Basic'),
  sort: 150,
  steps: {
    createField: {
      handler(ctx, params) {
        const { collectionField } = ctx.model;
        ctx.model.field = ctx.model.field || ctx.model.createField();
        ctx.model.setComponentProps(collectionField.getComponentProps());
        if (collectionField.enum.length) {
          ctx.model.setDataSource(collectionField.enum);
        }
        const validator = collectionField.uiSchema?.['x-validator'];
        if (validator) {
          ctx.model.setValidator(validator);
        }
      },
    },
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
    initialValue: {
      title: tval('Set default value'),
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
      title: tval('Required'),
      uiSchema: {
        required: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: tval('Yes'),
            unCheckedChildren: tval('No'),
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setRequired(params.required || false);
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
        ctx.model.setDisplayLabel(params.displayLabel === undefined ? true : params.displayLabel);
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
        ctx.model.setDescription(params.description);
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
        ctx.model.setTooltip(params.tooltip);
      },
    },
    pattern: {
      title: tval('Pattern'),
      uiSchema: {
        pattern: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
            {
              value: 'editable',
              label: tval('Editable'),
            },
            {
              value: 'disabled',
              label: tval('Disabled'),
            },
            {
              value: 'readOnly',
              label: tval('ReadOnly'),
            },
            {
              value: 'readPretty',
              label: tval('ReadPretty'),
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
