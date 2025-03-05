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
const NAMESPACE = 'variable-filters';
const tval = (key) => `{{t('${key}', { ns: '${NAMESPACE}', nsMode: 'fallback' })}}`;
export const variableFilters = [
  {
    name: 'date_format',
    title: 'format',
    handler: dateFormat,
    group: 'date',
    sort: 1,
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
    sort: 2,
    uiSchema: [
      {
        name: 'number',
        title: tval('Amount'),
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
          { label: tval('Quarter'), value: 'quarter' },
          { label: tval('Week'), value: 'week' },
          { label: tval('Day'), value: 'day' },
          { label: tval('Hour'), value: 'hour' },
          { label: tval('Minute'), value: 'minute' },
          { label: tval('Second'), value: 'second' },
        ],
      },
    ],
  },
  {
    name: 'date_subtract',
    title: 'substract',
    handler: dateSubtract,
    group: 'date',
    sort: 3,
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
          { label: tval('Quarter'), value: 'quarter' },
          { label: tval('Week'), value: 'week' },
          { label: tval('Day'), value: 'day' },
          { label: tval('Hour'), value: 'hour' },
          { label: tval('Minute'), value: 'minute' },
          { label: tval('Second'), value: 'second' },
        ],
      },
    ],
  },
  {
    name: 'array_first',
    title: 'first',
    handler: first,
    sort: 4,
    group: 'array',
  },
  {
    name: 'array_last',
    title: 'last',
    sort: 5,
    handler: first,
    group: 'array',
  },
];

export const filterGroups = [
  {
    name: 'date',
    title: "{{t('Date')}}",
    sort: 1,
  },
  { name: 'array', title: "{{t('Array')}}", sort: 2 },
];
