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

export class MultipleSelectFieldInterface extends CollectionFieldInterface {
  name = 'multipleSelect';
  type = 'object';
  group = 'choices';
  order = 3;
  title = '{{t("Multiple select")}}';
  default = {
    type: 'array',
    defaultValue: [],
    uiSchema: {
      type: 'array',
      'x-component': 'Select',
      'x-component-props': {
        mode: 'multiple',
      },
      enum: [],
    },
  };
  availableTypes = ['array', 'json'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  };
  filterable = {
    operators: 'array',
  };
}
