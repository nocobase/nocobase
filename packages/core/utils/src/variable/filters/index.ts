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
  { name: 'date_format', label: 'format', filterFn: dateFormat, category: 'date' },
  { name: 'date_add', label: 'add', filterFn: dateAdd, category: 'date' },
  { name: 'date_subtract', label: 'add', filterFn: dateSubtract, category: 'date' },
];
