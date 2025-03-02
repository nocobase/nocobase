/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dateFormat, dateAdd, dateSubtract } from './date';
import { first, last } from './array';
const NAMESPACE = 'json-templates';
const tval = (key) => `{{t('${key}', { ns: '${NAMESPACE}', nsMode: 'fallback' })}}`;
export const variableFilters = [
  {
    name: 'date_format',
    title: 'format',
    handler: dateFormat,
    group: 'date',
    uiSchema: [
      {
        name: 'format',
        title: tval('Format'),
        'x-component': 'Input',
        type: 'string',
        required: true,
      },
    ],
  },
  {
    name: 'date_add',
    title: 'add',
    handler: dateAdd,
    group: 'date',
    uiSchema: [
      {
        name: 'number',
        title: tval('Number'),
        type: 'number',
        'x-component': 'InputNumber',
        required: true,
      },
      {
        name: 'unit',
        title: tval('Unit'),
        type: 'string',
        required: true,
        'x-component': 'Select',
        enum: [
          { label: tval('Year'), value: 'year' },
          { label: tval('Month'), value: 'month' },
          { label: tval('Day'), value: 'day' },
        ],
      },
    ],
  },
  {
    name: 'date_subtract',
    title: 'substract',
    handler: dateSubtract,
    group: 'date',
    uiSchema: [
      {
        name: 'number',
        title: tval('Number'),
        type: 'number',
        'x-component': 'InputNumber',
        required: true,
      },
      {
        name: 'unit',
        title: tval('Unit'),
        type: 'string',
        required: true,
        'x-component': 'Select',
        enum: [
          { label: tval('Year'), value: 'year' },
          { label: tval('Month'), value: 'month' },
          { label: tval('Day'), value: 'day' },
        ],
      },
    ],
  },
  {
    name: 'array_first',
    label: 'first',
    filterFn: first,
    category: 'array',
  },
  {
    name: 'array_last',
    label: 'last',
    filterFn: first,
    category: 'array',
  },
];

export const filterGroups = [
  {
    name: 'date',
    title: "{{t('Date')}}",
    sort: 1,
  },
];
