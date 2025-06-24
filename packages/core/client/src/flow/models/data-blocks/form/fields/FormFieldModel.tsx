/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, Input } from '@formily/antd-v5';
import { uid } from '@formily/shared';
import type { FieldPatternTypes, FieldValidator } from '@formily/core';
import { Field, Form } from '@formily/core';
import { FieldContext } from '@formily/react';
import { CollectionField, FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { ReactiveField } from '../../../../formily/ReactiveField';

type FieldComponentTuple = [component: React.ElementType, props: Record<string, any>] | any[];

export class FormFieldModel extends FlowModel {
  collectionField: CollectionField;
  field: Field;

  get displayOnly() {
    return this.props.displayOnly;
  }

  get form() {
    return this.parent.form as Form;
  }

  get decorator() {
    if (this.displayOnly) return null;
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
    const field = this.form.createField({
      name: this.displayOnly ? uid() : this.collectionField.name,
      ...this.props,
      decorator: this.decorator ?? undefined,
      component: this.component,
    });
    if (this.displayOnly) {
      field.pattern = 'readPretty';
    }
    return field;
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
        // if (ctx.model.field) {
        //   return;
        // }
        const { displayOnly } = ctx.model.props;
        if (!ctx.shared.currentBlockModel && !displayOnly) {
          throw new Error('Current block model is not set in shared context');
        }
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!dataSourceKey || !collectionName || !fieldPath) {
          throw new Error('dataSourceKey, collectionName, and fieldPath are required parameters');
        }
        if (!ctx.model.parent && !displayOnly) {
          throw new Error('FormFieldModel must have a parent model');
        }
        const collectionField = ctx.globals.dataSourceManager.getCollectionField(
          `${dataSourceKey}.${collectionName}.${fieldPath}`,
        ) as CollectionField;
        if (!collectionField) {
          throw new Error(`Collection field not found for path: ${params.fieldPath}`);
        }
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
        !displayOnly && ctx.shared.currentBlockModel.addAppends(fieldPath);
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
