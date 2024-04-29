/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Plugin from '..';
import type { ExecutionModel, FlowNodeModel } from '../types';

export type CustomFunction = (this: { execution: ExecutionModel; node?: FlowNodeModel }) => any;

function now() {
  return new Date();
}

export default function ({ functions }: Plugin, more: { [key: string]: CustomFunction } = {}) {
  functions.register('now', now);

  for (const [name, fn] of Object.entries(more)) {
    functions.register(name, fn);
  }
}
