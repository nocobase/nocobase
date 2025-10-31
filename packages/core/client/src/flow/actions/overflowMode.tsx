/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';

export const overflowMode = defineAction({
  name: 'overflowMode',
  title: escapeT('Content overflow display mode'),
  uiSchema(ctx) {
    return {
      overflowMode: {
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: [
          { label: escapeT('Ellipsis'), value: 'ellipsis' },
          { label: escapeT('Wrap'), value: 'wrap' },
        ],
      },
    };
  },
  defaultParams: { overflowMode: 'ellipsis' },
  handler(ctx, params) {
    ctx.model.setProps({
      overflowMode: params.overflowMode,
    });
  },
});
