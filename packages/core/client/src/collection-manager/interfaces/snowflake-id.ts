/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { defaultProps, operators, unique, primaryKey } from './properties';

export class SnowflakeIdFieldInterface extends CollectionFieldInterface {
  name = 'snowflakeId';
  type = 'object';
  group = 'advanced';
  order = 0;
  title = '{{t("Snowflake ID (53-bit)")}}';
  primaryKeyDescription = '{{t("Primary key, distributed uniqueness, time-ordering")}}';
  hidden = false;
  sortable = true;
  default = {
    type: 'snowflakeId',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        separator: '0.00',
        step: '1',
      },
      'x-validator': 'integer',
    },
  };
  availableTypes = ['snowflakeId'];
  properties = {
    ...defaultProps,
    layout: {
      type: 'void',
      title: '{{t("Index")}}',
      'x-component': 'Space',
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        style: {
          marginBottom: '0px',
        },
      },
      properties: {
        primaryKey,
        unique,
      },
    },
  };
  filterable = {
    operators: operators.number,
  };

  description =
    '{{t("A 53-bit Snowflake ID designed to be compatible with JavaScript’s safe integer range, providing both time-ordering and uniqueness.") }}';
  titleUsable = true;
}
