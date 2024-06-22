/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getDayRange } from '@nocobase/utils';
import Plugin from '..';
import type { ExecutionModel, FlowNodeModel } from '../types';

export type CustomFunction = (this: { execution: ExecutionModel; node?: FlowNodeModel }) => any;

function now() {
  return new Date();
}

const dateRangeFns = {
  yesterday() {
    const yd = getDayRange({ now: new Date(), offset: -2, timezone: '+08:00' });
    return yd;
  },
  today() {
    const td = getDayRange({ now: new Date(), offset: -1, timezone: '+08:00' });
    return td;
  },
};

export default function ({ functions }: Plugin, more: { [key: string]: CustomFunction } = {}) {
  const dateRangeOptions = new Map(Object.entries(dateRangeFns));

  functions.register('now', now);
  functions.register('dateRange', dateRangeOptions);

  for (const [name, fn] of Object.entries(more)) {
    functions.register(name, fn);
  }
}
