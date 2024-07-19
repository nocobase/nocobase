/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { i18n } from '../../i18n';
import { defaultProps, operators } from './properties';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export class RichTextFieldInterface extends CollectionFieldInterface {
  name = 'richText';
  type = 'object';
  group = 'media';
  order = 2;
  title = '{{t("Rich Text")}}';
  default = {
    interface: 'richText',
    type: 'text',
    uiSchema: {
      type: 'string',
      'x-component': 'RichText',
    },
  };
  availableTypes = ['text', 'json', 'string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
  };
  schemaInitialize(schema: ISchema, { block }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
  }
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
    operators: operators.bigField,
  };
}
