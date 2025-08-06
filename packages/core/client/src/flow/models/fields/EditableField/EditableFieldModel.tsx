/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@formily/antd-v5';
import type { FieldPatternTypes, FieldValidator } from '@formily/core';
import { Field, Form } from '@formily/core';
import { FieldContext } from '@formily/react';
import { DefaultStructure, escapeT, FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { FormFieldGridModel, FormModel } from '../..';
import { ReactiveField } from '../../../formily/ReactiveField';
import { FieldModel } from '../../base/FieldModel';
import { JsonInput } from '../../common/JsonInput';

type FieldComponentTuple = [component: React.ElementType, props: Record<string, any>] | any[];

type Structure = {
  parent: FormFieldGridModel | FormModel;
};

export class EditableFieldModel<T extends DefaultStructure = DefaultStructure> extends FieldModel<T> {
  static supportedFieldInterfaces = '*' as any;
  field: Field;

  enableDisplayMode = true;
  enableFormItem = true;
  enableRequired = true;

  get form() {
    return this.context.form as Form;
  }

  get decorator() {
    return [FormItem, {}];
  }

  get component(): FieldComponentTuple {
    return [JsonInput, {}];
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
  showTitle(showTitle: boolean) {
    this.field.setDecoratorProps({
      labelStyle: { display: showTitle ? 'flex' : 'none' },
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
    const basePath = this.parent.context.basePath || this.context.basePath;
    const field = this.form.createField({
      name: this.collectionField.name,
      basePath: basePath,
      ...this.props,
      decorator: this.decorator,
      component: this.component,
    });
    return field;
  }

  async destroy() {
    // 在销毁模型前，先清理 Formily Field
    if (this.field) {
      this.field.destroy();
      this.field = null;
    }
    // 调用父类的 destroy 方法
    return super.destroy();
  }

  render() {
    return (
      <FieldContext.Provider value={this.field}>
        <ReactiveField key={this.uid} field={this.field}>
          {this.props.children}
        </ReactiveField>
      </FieldContext.Provider>
    );
  }
}

EditableFieldModel.registerFlow({
  key: 'formItemSettings',
  title: escapeT('Form item settings'),
  sort: 150,
  steps: {
    createField: {
      handler(ctx, params) {
        const { fieldProps = {} } = params;
        const { collectionField } = ctx.model;

        // 如果字段已存在但连接有问题，重新创建
        if (ctx.model.field && (!ctx.model.field.form || ctx.model.field.destroyed)) {
          ctx.model.field = null;
        }

        ctx.model.field = ctx.model.field || ctx.model.createField();
        ctx.model.setComponentProps({ ...collectionField.getComponentProps(), ...fieldProps });
        if (collectionField.enum.length) {
          ctx.model.setDataSource(collectionField.enum);
        }
        const validator = collectionField.uiSchema?.['x-validator'];
        if (validator) {
          ctx.model.setValidator(validator);
        }
      },
    },
    label: {
      title: escapeT('Label'),
      uiSchema: (ctx) => {
        if (!ctx.model.enableFormItem) {
          return null;
        }
        return {
          label: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const model = ctx.model;
              const originTitle = model.collectionField?.title;
              field.decoratorProps = {
                ...field.decoratorProps,
                extra: model.context.t('Original field title: ') + (model.context.t(originTitle) ?? ''),
              };
            },
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setTitle(params.label);
      },
      defaultParams: (ctx) => {
        return {
          title: ctx.model.collectionField?.title,
        };
      },
    },
    showLabel: {
      title: escapeT('Show label'),
      uiSchema: (ctx) => {
        if (!ctx.model.enableFormItem) {
          return null;
        }
        return {
          showLabel: {
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
            'x-component-props': {
              checkedChildren: escapeT('Yes'),
              unCheckedChildren: escapeT('No'),
            },
          },
        };
      },
      defaultParams: (ctx) => {
        return {
          showLabel: ctx.model.enableFormItem,
        };
      },
      handler(ctx, params) {
        ctx.model.showTitle(params.showLabel);
      },
    },
    tooltip: {
      title: escapeT('Tooltip'),
      uiSchema: (ctx) => {
        if (!ctx.model.enableFormItem) {
          return null;
        }
        return {
          tooltip: {
            'x-component': 'Input.TextArea',
            'x-decorator': 'FormItem',
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setTooltip(params.tooltip);
      },
    },
    description: {
      title: escapeT('Description'),
      uiSchema: (ctx) => {
        if (!ctx.model.enableFormItem) {
          return null;
        }
        return {
          description: {
            'x-component': 'Input.TextArea',
            'x-decorator': 'FormItem',
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setDescription(params.description);
      },
    },
    initialValue: {
      title: escapeT('Default value'),
      uiSchema: {
        defaultValue: {
          'x-component': 'DefaultValue',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: (ctx) => ({
        defaultValue: ctx.model.collectionField.defaultValue,
      }),
      handler(ctx, params) {
        ctx.model.setInitialValue(params.defaultValue);
      },
    },
    required: {
      title: escapeT('Required'),
      uiSchema(ctx) {
        if (!ctx.model.enableRequired) {
          return;
        }

        return {
          required: {
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
            'x-component-props': {
              checkedChildren: escapeT('Yes'),
              unCheckedChildren: escapeT('No'),
            },
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setRequired(params.required || false);
      },
    },
    pattern: {
      title: escapeT('Display mode'),
      uiSchema: (ctx) => {
        if (!ctx.model.enableDisplayMode) {
          return null;
        }
        return {
          pattern: {
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: [
              {
                value: 'editable',
                label: escapeT('Editable'),
              },
              {
                value: 'disabled',
                label: escapeT('Disabled'),
              },
              // {
              //   value: 'readOnly',
              //   label: escapeT('Read only'),
              // },
              {
                value: 'readPretty',
                label: escapeT('Display only'),
              },
            ],
          },
        };
      },
      defaultParams: (ctx) => ({
        pattern: ctx.model.collectionField.readonly ? 'disabled' : 'editable',
      }),
      handler(ctx, params) {
        if (ctx.model.enableDisplayMode) {
          ctx.model.setPattern(params.pattern);
        }
      },
    },
    model: {
      title: escapeT('Field component'),
      uiSchema: (ctx) => {
        const classes = [...ctx.model.collectionField.getSubclassesOf('FormFieldModel').keys()];
        if (classes.length === 1) {
          return null;
        }
        return {
          use: {
            type: 'string',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: classes.map((model) => ({
              label: model,
              value: model,
            })),
          },
        };
      },
      beforeParamsSave: async (ctx, params, previousParams) => {
        if (params.use !== previousParams.use) {
          await ctx.engine.replaceModel(ctx.model.uid, {
            use: params.use,
            stepParams: {
              fieldSettings: {
                init: ctx.model.getFieldSettingsInitParams(),
              },
              formItemSettings: {
                model: {
                  use: params.use,
                },
              },
            },
          });
          ctx.exit();
        }
      },
      defaultParams: (ctx) => {
        return {
          use: ctx.model.use,
        };
      },
      async handler(ctx, params) {
        console.log('Sub model step1 handler');
        if (!params.use) {
          throw new Error('model use is a required parameter');
        }
      },
    },
  },
});
