/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';
import { TableColumnModel } from '../models/blocks/table';

export const overflowMode = defineAction({
  name: 'overflowMode',
  title: tExpr('Content overflow ellipsis'),
  uiMode: 'switch',
  defaultParams: (ctx) => {
    return { overflowMode: ctx.model.parent instanceof TableColumnModel ? true : false };
  },
  handler(ctx, params) {
    ctx.model.setProps({
      overflowMode: params.overflowMode ? 'ellipsis' : 'wrap',
    });
  },
});
