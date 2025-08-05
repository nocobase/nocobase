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
  componentProps: any = {};
  enableDisplayMode = true;
  enableFormItem = true;

  get form() {
    return this.context.form;
  }

  // get decorator() {
  //   return [FormItem, {}];
  // }

  get component(): FieldComponentTuple {
    return [JsonInput, {}];
  }

  // setTitle(title: string) {
  //   this.field.title = title || this.collectionField.title;
  // }

  // setRequired(required: boolean) {
  //   this.field.required = required;
  // }

  // setInitialValue(initialValue: any) {
  //   this.field.initialValue = initialValue;
  // }

  setComponentProps(componentProps) {
    this.componentProps = {
      ...this.componentProps,
      ...componentProps,
    };
  }

  getComponentProps() {
    return {
      style: { width: '100%' },
      ...this.collectionField.getComponentProps(),
      ...this.componentProps,
      value: this.form.getFieldValue(this.fieldPath),
      onChange: (val) => {
        this.form.setFieldValue(this.fieldPath, val);
      },
    };
  }

  // setDataSource(dataSource: any[]) {
  //   this.field.dataSource = dataSource;
  // }

  // setValidator(validator: FieldValidator) {
  //   this.field.validator = validator;
  // }
  // setDecoratorProps(decoratorProps) {
  //   this.field.setDecoratorProps(decoratorProps);
  // }

  // getDecoratorProps() {
  //   return this.field.decoratorProps;
  // }
  // showTitle(showTitle: boolean) {
  //   this.field.setDecoratorProps({
  //     labelStyle: { display: showTitle ? 'flex' : 'none' },
  //   });
  // }
  // setDescription(description: string) {
  //   this.field.description = description;
  // }
  // setPattern(pattern: FieldPatternTypes) {
  //   this.field.pattern = pattern;
  // }
  // setTooltip(tooltip: string) {
  //   this.field.setDecoratorProps({
  //     tooltip: tooltip,
  //   });
  // }
  // createField() {
  //   const basePath = this.parent.context.basePath || this.context.basePath;
  //   const field = this.form.createField({
  //     name: this.collectionField.name,
  //     basePath: basePath,
  //     ...this.props,
  //     decorator: this.decorator,
  //     component: this.component,
  //   });
  //   return field;
  // }

  // async destroy() {
  //   // 在销毁模型前，先清理 Formily Field
  //   if (this.field) {
  //     this.field.destroy();
  //     this.field = null;
  //   }
  //   // 调用父类的 destroy 方法
  //   return super.destroy();
  // }

  render() {
    const [Component, props = {}] = this.component;
    return <Component {...props} {...this.getComponentProps()} />;
  }
}

EditableFieldModel.registerFlow({
  key: 'editableItemSettings',
  title: escapeT('Form component settings'),
  sort: 150,
  steps: {
    model: {
      title: escapeT('Field component'),
      uiSchema: (ctx) => {
        const classes = [...ctx.model.collectionField.getSubclassesOf('FormFieldModel').keys()];
        console.log(8888);
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
