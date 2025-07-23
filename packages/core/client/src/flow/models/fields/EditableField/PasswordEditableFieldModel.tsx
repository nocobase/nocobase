/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Password } from '@formily/antd-v5';
import { tval } from '@nocobase/utils/client';
import { FormFieldModel } from './FormFieldModel';

export class PasswordEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['password'];
  get component() {
    return [Password, {}];
  }
}

PasswordEditableFieldModel.registerFlow({
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
        ctx.model.setComponentProps({ placeholder: params.placeholder });
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
        ctx.model.setComponentProps({ checkStrength: params.checkStrength || false });
      },
    },
  },
});
