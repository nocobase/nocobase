/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defaultProps, unique } from './properties';
import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';

export class EmailFieldInterface extends CollectionFieldInterface {
  name = 'email';
  type = 'object';
  group = 'basic';
  order = 4;
  title = '{{t("Email")}}';
  sortable = true;
  default = {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': 'email',
    },
  };
  availableTypes = ['string'];
  hasDefaultValue = true;
  validationType = 'string';
  availableValidationOptions = ['min', 'max', 'length', 'email', 'pattern'];
  properties = {
    ...defaultProps,
    unique,
  };
  filterable = {
    operators: 'string',
  };
  titleUsable = true;
}
