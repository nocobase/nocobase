/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '@nocobase/client-v2';
import { SequenceRulesConfigureField } from './SequenceRulesConfigureField';
import { tExpr } from './locale';

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

const sequenceRuleTypes = [
  {
    value: 'string',
    label: tExpr('Fixed text'),
    defaults: { value: '' },
    fields: [{ name: 'value', label: tExpr('Text content'), component: 'Input', required: true }],
  },
  {
    value: 'randomChar',
    label: tExpr('Random character'),
    defaults: { length: 6, charsets: ['number'] },
    fields: [
      {
        name: 'length',
        label: tExpr('Length'),
        component: 'InputNumber',
        componentProps: { min: 1, max: 32 },
        required: true,
      },
      {
        name: 'charsets',
        label: tExpr('Character sets'),
        component: 'Select',
        componentProps: { mode: 'multiple', allowClear: false },
        enum: [
          { value: 'number', label: tExpr('Number') },
          { value: 'lowercase', label: tExpr('Lowercase letters') },
          { value: 'uppercase', label: tExpr('Uppercase letters') },
          { value: 'symbol', label: tExpr('Symbols') },
        ],
        required: true,
      },
    ],
  },
  {
    value: 'integer',
    label: tExpr('Autoincrement'),
    defaults: { digits: 4, start: 1 },
    fields: [
      {
        name: 'digits',
        label: tExpr('Digits'),
        component: 'InputNumber',
        componentProps: { min: 1, max: 10 },
        required: true,
      },
      {
        name: 'start',
        label: tExpr('Start from'),
        component: 'InputNumber',
        componentProps: { min: 0 },
        required: true,
      },
      { name: 'cycle', label: tExpr('Reset cycle'), component: 'CronCycle' },
    ],
  },
  {
    value: 'date',
    label: tExpr('Date'),
    defaults: { format: 'YYYYMMDD' },
    fields: [{ name: 'format', label: tExpr('Date format'), component: 'Input', required: true }],
  },
];

export class SequenceFieldInterface extends CollectionFieldInterface {
  name = 'sequence';
  type = 'object';
  group = 'advanced';
  order = 3;
  title = tExpr('Sequence');
  description = tExpr(
    'Automatically generate codes based on configured rules, supporting combinations of dates, numbers, and text.',
  );
  sortable = true;
  default = {
    interface: 'sequence',
    type: 'sequence',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-component-props': {},
    },
  };
  availableTypes = ['sequence'];
  hasDefaultValue = false;
  filterable = {
    operators: 'string',
  };
  titleUsable = true;
  configure = {
    components: {
      SequenceRules: SequenceRulesConfigureField,
    },
    properties: {
      ...defaultProps,
      unique: {
        type: 'boolean',
        'x-content': '{{t("Unique")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Checkbox',
        'x-disabled': '{{ !createMainOnly || primaryKeyOnly }}',
      },
      patterns: {
        type: 'array',
        title: tExpr('Sequence rules'),
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'SequenceRules',
        'x-component-props': {
          ruleTypes: sequenceRuleTypes,
        },
        default: [{ type: 'integer', options: { digits: 4, start: 1 } }],
      },
      inputable: {
        type: 'boolean',
        title: tExpr('Inputable'),
        'x-decorator': 'FormItem',
        'x-component': 'Checkbox',
      },
      match: {
        type: 'boolean',
        title: tExpr('Match rules'),
        'x-decorator': 'FormItem',
        'x-component': 'Checkbox',
        'x-hidden': '{{ !inputable }}',
      },
    },
  };
}
