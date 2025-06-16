/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Password } from '@formily/antd-v5';
import { FormFieldModel } from '../../../FormFieldModel';

export class PasswordFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['password'];
  get component() {
    return [Password, {}];
  }
}

PasswordFieldModel.registerFlow({
  key: 'key3',
  auto: true,
  sort: 1000,
  title: 'Group3',
  steps: {
    placeholder: {
      title: 'Placeholder',
      uiSchema: {
        checkStrength: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setComponentProps({ placeholder: params.placeholder });
      },
    },
    checkStrength: {
      title: 'Check strength',
      uiSchema: {
        checkStrength: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: 'Yes',
            unCheckedChildren: 'No',
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setComponentProps({ checkStrength: params.checkStrength || false });
      },
    },
  },
});
