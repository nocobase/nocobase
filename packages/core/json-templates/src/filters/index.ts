/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dateFormat, dateAdd, dateSubtract } from './date';

export const variableFilters = [
  {
    name: 'date_format',
    label: 'format',
    filterFn: dateFormat,
    category: 'date',
    paramSchema: [
      {
        label: "{{t('Format')}}",
        'x-component': 'Input',
        type: 'string',
        required: true,
      },
    ],
  },
  {
    name: 'date_add',
    label: 'add',
    filterFn: dateAdd,
    category: 'date',
    paramSchema: [
      {
        title: "{{t('Number')}}",
        type: 'number',
        required: true,
      },
      {
        title: 'unit',
        type: 'string',
        required: true,
        'x-component': 'Select',
        enum: [
          { label: "{{t('Year')}}", value: 'year' },
          { label: "{{t('Month')}}", value: 'month' },
          { label: "{{t('Day')}}", value: 'day' },
        ],
      },
    ],
  },
  {
    name: 'date_subtract',
    label: 'substract',
    filterFn: dateSubtract,
    category: 'date',
    paramSchema: [
      {
        title: "{{t('Number')}}",
        type: 'number',
        required: true,
      },
      {
        title: "{{t('Unit')}}",
        type: 'string',
        required: true,
        'x-component': 'Select',
        enum: [
          { label: "{{t('Year')}}", value: 'year' },
          { label: "{{t('Month')}}", value: 'month' },
          { label: "{{t('Day')}}", value: 'day' },
        ],
      },
    ],
  },
];
