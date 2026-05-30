/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dataSource, defaultProps } from './properties';
import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';

export class SelectFieldInterface extends CollectionFieldInterface {
  name = 'select';
  type = 'object';
  group = 'choices';
  order = 2;
  title = '{{t("Single select")}}';
  sortable = true;
  default = {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Select',
      enum: [],
    },
  };
  availableTypes = ['string', 'bigInt', 'boolean'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  };
  filterable = {
    operators: 'enumType',
  };
  titleUsable = true;
}
