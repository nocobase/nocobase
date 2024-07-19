/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { dataSource, defaultProps, operators } from './properties';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export class CheckboxGroupFieldInterface extends CollectionFieldInterface {
  name = 'checkboxGroup';
  type = 'object';
  group = 'choices';
  order = 5;
  title = '{{t("Checkbox group")}}';
  default = {
    interface: 'checkboxGroup',
    type: 'array',
    defaultValue: [],
    uiSchema: {
      type: 'string',
      'x-component': 'Checkbox.Group',
    },
  };
  availableTypes = ['array', 'json'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  };
  filterable = {
    operators: operators.array,
  };

  schemaInitialize(schema: ISchema, { block }: { block: string }): void {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
  }
}
