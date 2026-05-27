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

const defaultProps = {
  'uiSchema.title': {
    type: 'string',
    title: '{{t("Field display name")}}',
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  name: {
    type: 'string',
    title: '{{t("Field name")}}',
    required: true,
    'x-disabled': '{{ !createOnly }}',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-validator': 'uid',
    description:
      "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
  },
};

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
    Component: SortFieldConfigureForm,
    getConfigureFormProperties(collectionInfo?: Record<string, any>) {
      const scopeKeyOptions = (collectionInfo?.fields || [])
        .filter((field) => ['string', 'bigInt', 'integer'].includes(field.type))
        .map((field) => ({
          value: field.name,
          label: field.uiSchema?.title || field.name,
        }));

      return {
        ...defaultProps,
        scopeKey: {
          type: 'string',
          title: tExpr('Grouped sorting'),
          'x-disabled': '{{ !editMainOnly}}',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: scopeKeyOptions,
          description: tExpr('When a field is selected for grouping, it will be grouped first before sorting.'),
        },
      };
    },
  };
  filterable = {
    operators: 'number',
  };
  validateSchema = () => {
    return {
      maximum: {
        type: 'number',
        title: tExpr('Maximum'),
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': `{{(field) => {
          const targetValue = field.query('.minimum').value();
          field.selfErrors =
            !!targetValue && !!field.value && targetValue > field.value ? t("Maximum must greater than minimum") : ''
        }}}`,
      },
      minimum: {
        type: 'number',
        title: tExpr('Minimum'),
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': {
          dependencies: ['.maximum'],
          fulfill: {
            state: {
              selfErrors:
                '{{!!$deps[0] && !!$self.value && $deps[0] < $self.value ? t("Minimum must less than maximum") : ""}}',
            },
          },
        },
      },
      format: {
        type: 'string',
        title: tExpr('Format'),
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-component-props': {
          allowClear: true,
        },
        enum: [
          {
            label: tExpr('Odd'),
            value: 'odd',
          },
          {
            label: tExpr('Even'),
            value: 'even',
          },
        ],
      },
      pattern: {
        type: 'string',
        title: tExpr('Regular expression'),
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          prefix: '/',
          suffix: '/',
        },
      },
    };
  };
}
