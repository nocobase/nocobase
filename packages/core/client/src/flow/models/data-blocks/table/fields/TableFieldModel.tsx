/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FieldModel } from '../../../base/FieldModel';

export class TableFieldModel extends FieldModel {
  getValue() {
    return this.ctx.shared.value;
  }

  public render() {
    return (
      <span>
        {this.props.prefix}
        {this.getValue()}
        {this.props.suffix}
      </span>
    );
  }
}

TableFieldModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx) {
        if (!ctx.model.parent) {
          throw new Error('TableFieldModel must have a parent model');
        }
        if (!ctx.shared.currentBlockModel) {
          throw new Error('TableFieldModel must have a currentBlockModel in shared context');
        }
        const collectionField = ctx.model.parent.collectionField;
        ctx.model.fieldPath = ctx.model.parent.fieldPath;
        ctx.model.collectionField = collectionField;
        ctx.model.setProps(collectionField.getComponentProps());
        ctx.shared.currentBlockModel.addAppends(ctx.model.parent.fieldPath);
      },
    },
  },
});

TableFieldModel.registerFlow({
  key: 'default2',
  auto: true,
  steps: {
    step2: {
      title: 'Edit Title',
      uiSchema: {
        prefix: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: 'Prefix',
          },
        },
        suffix: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: 'Suffix',
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps(params);
      },
    },
  },
});
