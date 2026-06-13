/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerValidateRules } from '@formily/core';
import { defaultProps } from './properties';
import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';

registerValidateRules({
  json(value) {
    try {
      JSON.parse(value);
      return true;
    } catch (error) {
      return {
        type: 'error',
        message: error.message,
      };
    }
  },
});

export class JsonFieldInterface extends CollectionFieldInterface {
  name = 'json';
  type = 'object';
  group = 'advanced';
  order = 4;
  title = '{{t("JSON")}}';
  sortable = false;
  default = {
    type: 'json',
    // name,
    uiSchema: {
      type: 'object',
      // title,
      'x-component': 'Input.JSON',
      'x-component-props': {
        autoSize: {
          minRows: 5,
          // maxRows: 20,
        },
      },
      default: null,
    },
  };
  availableTypes = ['json', 'array', 'set', 'jsonb', 'text', 'circle', 'lineString', 'point', 'polygon'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    jsonb: {
      title: 'JSONB',
      'x-component': 'Checkbox',
    },
  };
  configure = {
    items: [
      {
        name: 'jsonb',
        title: 'JSONB',
        component: 'Checkbox',
        schema: {
          'x-content': ' ',
        },
        hidden: ({ context }) => {
          const isDialect = context.isDialect;
          return typeof isDialect === 'function' ? !isDialect('postgres') : true;
        },
        disabled: ({ context }) => !!context.disabledJSONB,
      },
    ],
  };
  // filterable = {
  //   operators: operators.string,
  // };
}
