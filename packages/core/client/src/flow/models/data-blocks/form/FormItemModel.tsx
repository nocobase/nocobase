/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { escapeT, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';
import { Form } from 'antd';
import { FieldModel } from '../../base/FieldModel';
import { FormFieldGridModel } from './FormFieldGridModel';

export class FormItemModel extends FieldModel<{
  parent: FormFieldGridModel;
  subModels: { field: FieldModel };
}> {
  decoratorProps = observable({} as any);

  setDecoratorProps(props) {
    Object.assign(this.decoratorProps, props);
  }

  showTitle(showTitle: boolean) {
    this.setDecoratorProps({
      labelStyle: { display: showTitle ? 'flex' : 'none' },
    });
  }

  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('fieldValue', {
      get: () => this.context.record?.[this.fieldPath],
      cache: false,
    });
  }

  render() {
    const fieldModel = this.subModels.field as FieldModel;
    const basePath = this.context.basePath;
    const fieldPath = this.fieldPath;
    const fullPath = basePath ? `${basePath}.${fieldPath}` : fieldPath;
    return (
      <Form.Item
        {...this.decoratorProps}
        extra={this.decoratorProps?.description}
        label={this.decoratorProps.title}
        name={fullPath}
      >
        <FlowModelRenderer model={fieldModel} />
      </Form.Item>
    );
  }
}

FormItemModel.define({
  icon: 'FormItemModel',
  defaultOptions: {
    use: 'FormItemModel',
  },
  sort: 100,
});

FormItemModel.registerFlow({
  key: 'editItemSettings',
  sort: 300,
  title: escapeT('Form item settings'),
  steps: {
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsAutoFlows('field');
      },
    },
    label: {
      title: escapeT('Label'),
      uiSchema: (ctx) => {
        return {
          title: {
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
      defaultParams: (ctx) => {
        return {
          title: ctx.collectionField.title,
        };
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ title: params.title });
      },
    },
    showLabel: {
      title: escapeT('Show label'),
      uiSchema: {
        showLabel: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: escapeT('Yes'),
            unCheckedChildren: escapeT('No'),
          },
        },
      },
      defaultParams: {
        showLabel: true,
      },
      handler(ctx, params) {
        ctx.model.showTitle(params.showLabel);
      },
    },
    tooltip: {
      title: escapeT('Tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ tooltip: params.tooltip });
      },
    },
    description: {
      title: escapeT('Description'),
      uiSchema: {
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ description: params.description });
      },
    },
    initialValue: {
      title: escapeT('Default value'),
      uiSchema: {
        defaultValue: {
          'x-component': 'VariableEditableValue',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: (ctx) => ({
        defaultValue: ctx.model.collectionField.defaultValue,
      }),
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ initialValue: params.defaultValue });
      },
    },
    required: {
      title: escapeT('Required'),
      uiSchema: {
        required: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: escapeT('Yes'),
            unCheckedChildren: escapeT('No'),
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ required: params.required || false });
      },
    },
  },
});
