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
    items: [
      {
        name: 'unique',
        title: '{{t("Unique")}}',
        component: 'Checkbox',
      },
      {
        name: 'patterns',
        title: tExpr('Sequence rules'),
        required: true,
        Component: SequenceRulesConfigureField,
        componentProps: {
          ruleTypes: sequenceRuleTypes,
        },
        defaultValue: [{ type: 'integer', options: { digits: 4, start: 1 } }],
      },
      {
        name: 'inputable',
        title: tExpr('Inputable'),
        component: 'Checkbox',
      },
      {
        name: 'match',
        title: tExpr('Match rules'),
        component: 'Checkbox',
        hidden: ({ values }) => !values.inputable,
      },
    ],
  };
}
