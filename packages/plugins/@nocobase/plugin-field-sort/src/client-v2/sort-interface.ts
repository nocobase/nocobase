/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '@nocobase/client-v2';
import { tExpr } from './locale';
import { SortFieldConfigureForm } from './SortFieldConfigureForm';

export class SortFieldInterface extends CollectionFieldInterface {
  name = 'sort';
  type = 'object';
  group = 'advanced';
  order = 1;
  title = tExpr('Sort');
  sortable = true;
  titleUsable = true;
  description = tExpr('Used for drag and drop sorting scenarios, supporting grouping sorting');
  default = {
    type: 'sort',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-validator': 'integer',
    },
  };
  availableTypes = ['sort'];
  hasDefaultValue = false;
  configure = {
    items: [
      {
        name: 'scopeKey',
        Component: SortFieldConfigureForm,
      },
    ],
  };
  filterable = {
    operators: 'number',
  };
}
