/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';
import { TableBlockModel } from '../models/blocks/table';

export const overflowMode = defineAction({
  name: 'overflowMode',
  title: tExpr('Content overflow display mode'),
  uiSchema(ctx) {
    return {
      overflowMode: {
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: [
          { label: tExpr('Ellipsis'), value: 'ellipsis' },
          { label: tExpr('Wrap'), value: 'wrap' },
        ],
      },
    };
  },
  defaultParams: (ctx) => {
    return { overflowMode: ctx.blockModel instanceof TableBlockModel ? 'ellipsis' : 'wrap' };
  },
  handler(ctx, params) {
    ctx.model.setProps({
      overflowMode: params.overflowMode,
    });
  },
});
