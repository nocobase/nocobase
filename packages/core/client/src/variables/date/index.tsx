/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// date context
export type DateVariableContext = {
  timezone: string;
  rangeConverter: 'start' | 'end' | 'range';
};

const dateVars = [
  {
    key: 'now',
    label: 'Now',
    type: 'date',
    exampleValue: new Date(),
  },
  {
    key: 'today',
    label: 'Today',
    type: 'date',
    exampleValue: new Date(),
  },
  {
    key: 'yesterday',
    label: 'Yesterday',
    type: 'date',
    exampleValue: new Date(),
  },
  {
    key: 'tomorrow',
    label: 'Tomorrow',
    type: 'date',
    exampleValue: new Date(),
  },
];
