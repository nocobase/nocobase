/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import { tval } from '@nocobase/utils/client';
import { EditableItemModel } from '@nocobase/flow-engine';
import { FormFieldModel } from './FormFieldModel';

export class PasswordFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['password'];
  get component() {
    return [Input.Password, {}];
  }
}

PasswordFieldModel.registerFlow({
  key: 'passwordSettings',
  sort: 1000,
  title: tval('Password settings'),
  steps: {
    placeholder: {
      title: tval('Placeholder'),
      uiSchema: {
        placeholder: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: tval('Enter placeholder text'),
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({ placeholder: params.placeholder });
      },
    },
    checkStrength: {
      title: tval('Check strength'),
      uiSchema: {
        checkStrength: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: tval('Yes'),
            unCheckedChildren: tval('No'),
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
