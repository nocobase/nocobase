/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Helper } from '@nocobase/json-template-parser';
import { first } from './array';
import { dateAdd, dateFormat, dateSubtract } from './date';
const NAMESPACE = 'variable-helpers';

function tval(text: string) {
  return `{{t(${JSON.stringify(text)}, ${JSON.stringify({ ns: NAMESPACE, nsMode: 'fallback' })})}}`;
}

export const helpers: Helper[] = [
  {
    name: 'date_format',
    title: 'format',
    handler: dateFormat,
    group: 'date',
    inputType: 'date',
    outputType: 'string',
    sort: 1,
    args: [],
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
    inputType: 'date',
    outputType: 'date',
    sort: 2,
    args: [],
    uiSchema: [
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
      {
        name: 'number',
        title: tval('Amount'),
        type: 'number',
        'x-component': 'InputNumber',
        required: true,
      },
    ],
  },
  {
    name: 'date_subtract',
    title: 'substract',
    handler: dateSubtract,
    group: 'date',
    inputType: 'date',
    outputType: 'date',
    sort: 3,
    args: [],
    uiSchema: [
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
      {
        name: 'number',
        title: tval('Amount'),
        type: 'number',
        'x-component': 'InputNumber',
        required: true,
      },
    ],
  },
  {
    name: 'array_first',
    title: 'first',
    handler: first,
    sort: 4,
    args: [],
    group: 'array',
    inputType: 'string',
    outputType: 'any',
  },
  {
    name: 'array_last',
    title: 'last',
    sort: 5,
    args: [],
    handler: first,
    group: 'array',
    inputType: 'string',
    outputType: 'any',
  },
];

export const helperGroups = [
  {
    name: 'date',
    title: "{{t('Date')}}",
    sort: 1,
  },
  { name: 'array', title: "{{t('Array')}}", sort: 2 },
];
