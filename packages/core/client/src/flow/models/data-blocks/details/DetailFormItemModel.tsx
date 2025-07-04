/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import { Field, Form } from '@formily/core';
import { FormItem } from '@formily/antd-v5';
import { FieldContext } from '@formily/react';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { ReactiveField } from '../../../formily/ReactiveField';

export class DetailFormItemModel extends FieldModel {
  field: Field;
  get form() {
    return this.parent.form as Form;
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
  setTooltip(tooltip: string) {
    this.field.setDecoratorProps({
      tooltip: tooltip,
    });
  }
  setComponentProps(componentProps) {
    this.field.setComponentProps(componentProps);
  }
  setDataSource(dataSource: any[]) {
    this.field.dataSource = dataSource;
  }
  get decorator() {
    return [FormItem, {}];
  }

  createField() {
    return this.form.createField({
      name: this.collectionField.name,
      decorator: this.decorator,
      title: this.collectionField.title,
      ...this.props,
    });
  }

  render() {
    const fork = (this.subModels.field as any).createFork({});
    fork.setSharedContext({ value: this.field.value });
    return (
      <FieldContext.Provider value={this.field}>
        <ReactiveField field={this.field}>{fork.render()}</ReactiveField>
      </FieldContext.Provider>
    );
  }
}

DetailFormItemModel.define({
  title: tval('Detail Item'),
  icon: 'DetailFormItem',
  defaultOptions: {
    use: 'DetailFormItemModel',
  },
  sort: 100,
});

DetailFormItemModel.registerFlow({
  key: 'detailFieldDefault',
  auto: true,
  sort: 120,
  steps: {
    createField: {
      handler(ctx, params) {
        const { collectionField } = ctx.model;
        ctx.model.field = ctx.model.field || ctx.model.createField();
        ctx.model.setComponentProps(collectionField.getComponentProps());
        if (collectionField.enum.length) {
          ctx.model.setDataSource(collectionField.enum);
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
  },
});
