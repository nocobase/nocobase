/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import React from 'react';
import { EditableItemModel, tExpr } from '@nocobase/flow-engine';
import { FieldModel } from '../base';

export class PasswordFieldModel extends FieldModel {
  render() {
    return <Input.Password {...this.props} />;
  }
}

PasswordFieldModel.registerFlow({
  key: 'passwordSettings',
  sort: 1000,
  title: tExpr('Password settings'),
  steps: {
    placeholder: {
      title: tExpr('Placeholder'),
      uiSchema: {
        placeholder: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: tExpr('Enter placeholder text'),
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({ placeholder: params.placeholder });
      },
    },
    checkStrength: {
      title: tExpr('Check strength'),
      uiSchema: {
        checkStrength: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: tExpr('Yes'),
            unCheckedChildren: tExpr('No'),
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({ checkStrength: params.checkStrength || false });
      },
    },
  },
});

EditableItemModel.bindModelToInterface('PasswordFieldModel', ['password'], {
  isDefault: true,
});
