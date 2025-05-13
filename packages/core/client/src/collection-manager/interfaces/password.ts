/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { i18n } from '../../i18n';
import { defaultProps, unique, operators } from './properties';

export class PasswordFieldInterface extends CollectionFieldInterface {
  name = 'password';
  type = 'object';
  group = 'basic';
  order = 9;
  title = '{{t("Password")}}';
  default = {
    type: 'password',
    hidden: true,
    uiSchema: {
      type: 'string',
      'x-component': 'Password',
    },
  };
  availableTypes = ['password', 'string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    unique,
  };
  validateSchema = (fieldSchema) => {
    return {
      max: {
        type: 'number',
        title: '{{ t("Max length") }}',
        minimum: 0,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': `{{(field) => {
          const targetValue = field.query('.min').value();
          field.selfErrors =
            !!targetValue && !!field.value && targetValue > field.value ? '${i18n.t(
              'Max length must greater than min length',
            )}' : ''
        }}}`,
      },
      min: {
        type: 'number',
        title: '{{ t("Min length") }}',
        minimum: 0,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': {
          dependencies: ['.max'],
          fulfill: {
            state: {
              selfErrors: `{{!!$deps[0] && !!$self.value && $deps[0] < $self.value ? '${i18n.t(
                'Min length must less than max length',
              )}' : ''}}`,
            },
          },
        },
      },
    };
  };
  filterable = {
    operators: operators.string,
  };
}
