/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';
import { defaultProps, unique } from './properties';

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
  validationType = 'string';
  availableValidationOptions = ['min', 'max', 'length', 'pattern'];
  properties = {
    ...defaultProps,
    unique,
  };
  filterable = {
    operators: 'string',
  };
}
