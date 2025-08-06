/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure, escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { observable } from '@formily/reactive';
import { FormFieldGridModel, FormModel } from '../..';
import { FieldModel } from '../../base/FieldModel';
import { JsonInput } from '../../common/JsonInput';

type FieldComponentTuple = [component: React.ElementType, props: Record<string, any>] | any[];

type Structure = {
  parent: FormFieldGridModel | FormModel;
};

export class EditableFieldModel<T extends DefaultStructure = DefaultStructure> extends FieldModel<T> {
  static supportedFieldInterfaces = '*' as any;
  componentProps: any = {} as any;

  get form() {
    return this.context.form;
  }

  get component(): FieldComponentTuple {
    return [JsonInput, {}];
  }

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
        const value = val && typeof val === 'object' && 'target' in val ? val.target.value : val;
        this.form.setFieldValue(this.fieldPath, value);
      },
    };
  }

  render() {
    const [Component, props = {}] = this.component;
    return <Component {...this.getComponentProps()} {...props} />;
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
