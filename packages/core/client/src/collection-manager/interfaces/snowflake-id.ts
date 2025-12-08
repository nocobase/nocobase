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
  title = '{{t("Snowflake ID")}}';
  hidden = false;
  sortable = true;
  default = {
    name: 'id',
    type: 'snowflakeId',
    autoIncrement: false,
    primaryKey: true,
    allowNull: false,
    uiSchema: {
      type: 'string',
      title: '{{t("ID")}}',
      'x-component': 'Input',
      'x-read-pretty': true,
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
    '{{t("NocoBase Snowflake ID, designed for safer use in JavaScript and MySQL. More detail: {{link}}", { link: "https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id", interpolation: { escapeValue: false } }) }}';
  titleUsable = true;
}
